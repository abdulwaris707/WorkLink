import Pusher from "pusher";

let pusherServerInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherServerInstance) return pusherServerInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || "mt1";

  if (appId && key && secret) {
    try {
      pusherServerInstance = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
      return pusherServerInstance;
    } catch (err) {
      console.warn("Failed to initialize Pusher server:", err);
      return null;
    }
  }

  return null;
}

/**
 * Triggers a real-time event to a Pusher channel.
 * Gracefully handles missing credentials or connection issues without breaking DB operations.
 */
export async function triggerRealtimeEvent(channel: string, event: string, data: any) {
  try {
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(channel, event, data);
    }
  } catch (err) {
    console.warn(`Pusher event trigger failed on ${channel}/${event}:`, err);
  }
}
