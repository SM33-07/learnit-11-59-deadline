import { NextRequest } from 'next/server';
import { subscribeToRoom, getOrCreateRoom } from '@/lib/room-manager';
import { GameRoom, PlayerRoomView } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const playerId = req.nextUrl.searchParams.get('playerId') || 'host';

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: GameRoom | PlayerRoomView) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed
        }
      };

      // Ensure room exists
      getOrCreateRoom(upperCode);

      // Subscribe to sanitized stream
      const unsubscribe = subscribeToRoom(upperCode, playerId, sendEvent);

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
