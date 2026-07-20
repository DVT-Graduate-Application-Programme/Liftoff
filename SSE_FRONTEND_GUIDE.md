# SSE Integration Guide — Frontend Team (Next.js)

## How this works

The C# backend does **not** serve SSE directly to browsers. Instead, it calls a lightweight webhook on the Next.js server whenever data changes. The Next.js server is then responsible for pushing that event to all connected browser clients.

```
Data changes in C# repo
  └─► POST /api/internal/notify  (Next.js — internal only)
        └─► broadcast to all connected browsers via your own SSE route
              └─► GET /api/events  (Next.js — public)
                    └─► browser EventSource
```

---

## What the backend will POST to you

**`POST /api/internal/notify`**

**Headers:**
```
Content-Type: application/json
X-Internal-Token: <shared secret>
```

**Body:**
```json
{
  "event": "evaluation-saved",
  "applicationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "changeType": null,
  "timestamp": "2026-07-20T07:08:12.345Z"
}
```

### Event names

| `event` value | Fired when… |
|---|---|
| `application-ingested` | A new application is submitted |
| `evaluation-saved` | The AI agent posts its evaluation |
| `evaluation-reset` | A re-evaluate is triggered |
| `ownership-changed` | A recruiter claims / shortlists / accepts / rejects / rates / notes |

### `changeType` values

Only populated for `ownership-changed`. Always `null` for all other events.

| Value | Meaning |
|---|---|
| `CLAIM` | Recruiter claimed the application |
| `SHORTLIST` | Recruiter shortlisted it |
| `ACCEPTED` | Recruiter accepted the candidate |
| `REJECTED` | Recruiter rejected the candidate |
| `RATING` | Recruiter rated the application |
| `NOTES` | Recruiter added/updated notes |

---

## Security — validate X-Internal-Token

Your `/api/internal/notify` route must only be callable by the C# backend, not the public internet.

```ts
// app/api/internal/notify/route.ts  (or pages/api/internal/notify.ts)
const SHARED_SECRET = process.env.INTERNAL_TOKEN;

if (request.headers.get('x-internal-token') !== SHARED_SECRET) {
  return new Response('Unauthorized', { status: 401 });
}
```

Set `INTERNAL_TOKEN` in your environment to match the backend's `NOTIFICATIONS__NEXTJS__SHAREDSECRET`.

---

## Implementation — choose based on your deployment

> [!IMPORTANT]
> The approach you use depends on **where Next.js is hosted**. Pick one.

---

### Option A — Self-hosted / Docker (in-memory EventEmitter)

Use this when Next.js runs as a **persistent Node.js process** (`next start`, Docker, Railway, Fly.io, etc.).

A singleton in-memory `EventEmitter` lives for the lifetime of the process. All browser SSE connections subscribe to it; the webhook fires into it.

#### `lib/sseEmitter.ts`
```ts
import { EventEmitter } from 'events';

// Singleton — one instance for the lifetime of the Node process.
const emitter = global.__sseEmitter ?? new EventEmitter();
emitter.setMaxListeners(0); // unlimited browser connections

if (process.env.NODE_ENV !== 'production') {
  // Prevent hot-reload from creating duplicate emitters in dev.
  (global as any).__sseEmitter = emitter;
}

export default emitter;
```

#### `app/api/internal/notify/route.ts`
```ts
import { NextRequest, NextResponse } from 'next/server';
import emitter from '@/lib/sseEmitter';

const SHARED_SECRET = process.env.INTERNAL_TOKEN;

export async function POST(request: NextRequest) {
  if (request.headers.get('x-internal-token') !== SHARED_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  // Broadcast to all connected SSE clients.
  emitter.emit('application-event', body);

  return NextResponse.json({ ok: true });
}
```

#### `app/api/events/route.ts`
```ts
import { NextRequest } from 'next/server';
import emitter from '@/lib/sseEmitter';

export const runtime = 'nodejs'; // must be Node — not edge

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        const payload = JSON.stringify(data);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      // Keepalive ping every 15 s so proxies don't close the connection.
      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);

      emitter.on('application-event', send);

      // Clean up when the browser disconnects.
      request.signal.addEventListener('abort', () => {
        emitter.off('application-event', send);
        clearInterval(ping);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering
    },
  });
}
```

---

### Option B — Vercel / multi-instance (Redis pub/sub via Upstash)

Use this when Next.js runs on **Vercel** (serverless) or any horizontally-scaled environment where multiple Node instances may be running. Each instance only knows about its own connected browsers, so you need a shared pub/sub bus.

**[Upstash Redis](https://upstash.com)** is the standard choice for Vercel — it's serverless-native and has a free tier.

> [!NOTE]
> Install: `npm install @upstash/redis`
> Set env vars: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (from the Upstash dashboard).
> Set the SSE channel name: `SSE_CHANNEL=application-events` (or any string you like).

#### `lib/redis.ts`
```ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const SSE_CHANNEL = process.env.SSE_CHANNEL ?? 'application-events';
```

#### `app/api/internal/notify/route.ts`
```ts
import { NextRequest, NextResponse } from 'next/server';
import { redis, SSE_CHANNEL } from '@/lib/redis';

const SHARED_SECRET = process.env.INTERNAL_TOKEN;

export async function POST(request: NextRequest) {
  if (request.headers.get('x-internal-token') !== SHARED_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  // Publish to Redis — all Next.js instances subscribed to this channel receive it.
  await redis.publish(SSE_CHANNEL, JSON.stringify(body));

  return NextResponse.json({ ok: true });
}
```

#### `app/api/events/route.ts`
```ts
import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { SSE_CHANNEL } from '@/lib/redis';

export const runtime = 'nodejs';

// Each SSE connection needs its own subscriber client (one subscribe per client).
function createSubscriber() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sub = createSubscriber();

      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);

      // @upstash/redis subscribe — callback fires on every published message.
      await sub.subscribe(SSE_CHANNEL, (message) => {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      });

      request.signal.addEventListener('abort', () => {
        clearInterval(ping);
        sub.unsubscribe(SSE_CHANNEL).catch(() => {});
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

---

## Browser usage (same for both options)

```ts
const source = new EventSource('/api/events');

source.onmessage = (e) => {
  const { event, applicationId, changeType } = JSON.parse(e.data);

  switch (event) {
    case 'application-ingested':
      refetchApplicationList();
      break;
    case 'evaluation-saved':
    case 'evaluation-reset':
      refetchApplication(applicationId);
      break;
    case 'ownership-changed':
      refetchOwnership(applicationId);
      break;
  }
};

source.onerror = () => {
  // EventSource reconnects automatically — no action needed.
};
```

---

## Environment variables you need

| Variable | Option A | Option B | Description |
|---|---|---|---|
| `INTERNAL_TOKEN` | ✅ | ✅ | Shared secret — must match backend's `NOTIFICATIONS__NEXTJS__SHAREDSECRET` |
| `UPSTASH_REDIS_REST_URL` | ❌ | ✅ | From Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | ✅ | From Upstash dashboard |
| `SSE_CHANNEL` | ❌ | optional | Redis channel name (default: `application-events`) |

### Dev value for `INTERNAL_TOKEN`

In development the backend sends `dev-secret-change-in-prod` (from `.env.development`).

```env
# .env.local (Next.js)
INTERNAL_TOKEN=dev-secret-change-in-prod
```

---

## Quick smoke test

```bash
# Terminal 1 — subscribe to the SSE stream
curl -N http://localhost:3000/api/events

# Terminal 2 — simulate a backend notification
curl -X POST http://localhost:3000/api/internal/notify \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: dev-secret-change-in-prod" \
  -d '{"event":"evaluation-saved","applicationId":"00000000-0000-0000-0000-000000000001","changeType":null,"timestamp":"2026-07-20T09:00:00Z"}'
```

You should see the event appear in Terminal 1 immediately.
