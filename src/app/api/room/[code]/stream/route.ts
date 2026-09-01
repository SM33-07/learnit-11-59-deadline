import { NextRequest } from 'next/server';
import { subscribeToRoom, getOrCreateRoom, getRoom } from '@/lib/room-manager';
import { GameRoom, PlayerRoomView } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const playerId = req.nextUrl.searchParams.get('playerId') || 'host';
  const sessionToken = req.nextUrl.searchParams.get('sessionToken') || req.headers.get('x-session-token');
  const hostToken = req.nextUrl.searchParams.get('hostToken') || req.headers.get('x-host-token');

  const room = getOrCreateRoom(upperCode);

  // Validate host or player credentials if provided
  if (playerId === 'host') {
    if (hostToken && room.hostToken && hostToken !== room.hostToken) {
      return new Response('Unauthorized host token', { status: 401 });
    }
  } else {
    const player = room.players[playerId];
    if (player && sessionToken && player.sessionToken && sessionToken !== player.sessionToken) {
      return new Response('Unauthorized session token', { status: 401 });
    }
  }

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
