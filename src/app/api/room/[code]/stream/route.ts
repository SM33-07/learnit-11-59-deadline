import { NextRequest } from 'next/server';
import { subscribeToRoom, getOrCreateRoom } from '@/lib/room-manager';
import { GameRoom } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (room: GameRoom) => {
        try {
          const data = `data: ${JSON.stringify(room)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed
        }
      };

      // Ensure room exists
      getOrCreateRoom(upperCode);

      // Subscribe to updates
      const unsubscribe = subscribeToRoom(upperCode, sendEvent);

      // Send keep-alive ping every 15s
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
