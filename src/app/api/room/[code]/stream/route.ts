import { NextRequest } from 'next/server';
import { subscribeToRoom, getRoom } from '@/lib/room-manager';
import { GameRoom, PlayerRoomView } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = (code || '').trim().toUpperCase();
  const playerId = req.nextUrl.searchParams.get('playerId') || 'host';
  const sessionToken = req.nextUrl.searchParams.get('sessionToken') || req.headers.get('x-session-token');
  const hostToken = req.nextUrl.searchParams.get('hostToken') || req.headers.get('x-host-token');

  const room = getRoom(upperCode);
  if (!room) {
    return new Response('Room not found', { status: 404 });
  }

  // Mandatory credential verification
  if (playerId === 'host') {
    if (!hostToken || hostToken !== room.hostToken) {
      return new Response('Unauthorized: Valid hostToken is required', { status: 401 });
    }
  } else {
    const player = room.players[playerId];
    if (!player) {
      return new Response('Player not found in room', { status: 404 });
    }
    if (!sessionToken || sessionToken !== player.sessionToken) {
      return new Response('Unauthorized: Valid sessionToken is required', { status: 401 });
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
