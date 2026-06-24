import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events endpoint for real-time project updates.
 * Clients connect via EventSource and receive DONATION, MILESTONE, and
 * HEARTBEAT events as they happen.
 *
 * The stream stays open until the client disconnects. A heartbeat is
 * sent every 25 seconds to keep load-balancer connections alive.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const encoder = new TextEncoder();

  function encode(data: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  let heartbeatTimer: NodeJS.Timeout | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected event
      controller.enqueue(
        encode({ type: "CONNECTED", slug, ts: Date.now() })
      );

      // Heartbeat every 25 seconds to prevent proxy timeouts
      heartbeatTimer = setInterval(() => {
        if (closed) {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          return;
        }
        try {
          controller.enqueue(encode({ type: "HEARTBEAT", ts: Date.now() }));
        } catch {
          // Client disconnected
          closed = true;
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 25_000);
    },
    cancel() {
      closed = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
      "Access-Control-Allow-Origin": "*",
    },
  });
}
