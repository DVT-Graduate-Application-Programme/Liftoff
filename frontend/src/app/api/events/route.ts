import { NextRequest } from "next/server";
import emitter from "@/lib/sse-emitter";
import type { ApplicationSseEvent } from "@/app/api/internal/notify/route";

// Must be the Node.js runtime — Edge runtime can't hold long-lived connections.
export const runtime = "nodejs";

/**
 * GET /api/events
 *
 * Browser clients connect here with EventSource. The stream stays open
 * until the client disconnects. Events are fanned out from the singleton
 * EventEmitter which the internal webhook POSTs into.
 */
export function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ApplicationSseEvent) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Keepalive ping every 15 s — prevents proxies and browsers from
      // closing the connection when there's no activity.
      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);

      emitter.on("application-event", send);

      request.signal.addEventListener("abort", () => {
        emitter.off("application-event", send);
        clearInterval(ping);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Prevents Nginx from buffering the stream before sending to the client.
      "X-Accel-Buffering": "no",
    },
  });
}
