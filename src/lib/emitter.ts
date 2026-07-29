import { EventEmitter } from "events";

/**
 * Process-wide singleton event bus used to push live updates (new payments,
 * appointments, notifications) to Server-Sent-Events endpoints.
 */
const g = globalThis as unknown as { salonEmitter?: EventEmitter };

export const emitter = g.salonEmitter ?? new EventEmitter();
emitter.setMaxListeners(100);

if (process.env.NODE_ENV !== "production") g.salonEmitter = emitter;

export function emitUpdate(salonId: string, payload: { kind: string; data: any }) {
  emitter.emit(`salon:${salonId}`, payload);
  emitter.emit("salon:all", { salonId, ...payload });
}

export function onUpdate(salonId: string | "all", cb: (payload: any) => void) {
  const event = salonId === "all" ? "salon:all" : `salon:${salonId}`;
  emitter.on(event, cb);
  return () => emitter.off(event, cb);
}
