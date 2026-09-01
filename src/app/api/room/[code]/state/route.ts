import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayerProjection } from '@/lib/room-manager';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = (code || '').trim().toUpperCase();
  const playerId = req.nextUrl.searchParams.get('playerId');
  const sessionToken = req.nextUrl.searchParams.get('sessionToken') || req.headers.get('x-session-token');
  const hostToken = req.nextUrl.searchParams.get('hostToken') || req.headers.get('x-host-token');

  const room = getRoom(upperCode);
  if (!room) {
    return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  }

  // Host access requires hostToken verification
  if (!playerId || playerId === 'host') {
    if (hostToken && room.hostToken && hostToken !== room.hostToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized host token' }, { status: 401 });
    }
    return NextResponse.json({ success: true, room });
  }

  // Player access requires valid player and sessionToken
  const player = room.players[playerId];
  if (!player) {
    return NextResponse.json({ success: false, error: 'Player not found in room' }, { status: 404 });
  }

  if (sessionToken && player.sessionToken && sessionToken !== player.sessionToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized session token' }, { status: 401 });
  }

  const projection = getPlayerProjection(room, playerId);
  if (!projection) {
    return NextResponse.json({ success: false, error: 'Player projection unavailable' }, { status: 404 });
  }

  return NextResponse.json({ success: true, view: projection });
}
