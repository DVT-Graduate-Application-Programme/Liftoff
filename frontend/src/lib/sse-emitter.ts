import { EventEmitter } from "events";

declare global {

  var __sseEmitter: EventEmitter | undefined;
}

/**
 * Singleton EventEmitter shared across all SSE connections for the lifetime
 * of the Node.js process.
 *
 * The `global` trick prevents Next.js hot-reload from creating a new instance
 * on every save in development, which would orphan existing connections.
 */
const emitter: EventEmitter =
  global.__sseEmitter ?? new EventEmitter();

emitter.setMaxListeners(0); // allow unlimited browser connections

if (process.env.NODE_ENV !== "production") {
  global.__sseEmitter = emitter;
}

export default emitter;
