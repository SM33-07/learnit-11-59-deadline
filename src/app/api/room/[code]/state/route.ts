import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getPlayerProjection } from '@/lib/room-manager';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = (code || '').trim().toUpperCase();
  const playerId = req.nextUrl.searchParams.get('playerId');

  const room = getRoom(upperCode);
  if (!room) {
    return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  }

  if (!playerId || playerId === 'host') {
    return NextResponse.json({ success: true, room });
  }

  const projection = getPlayerProjection(room, playerId);
  if (!projection) {
    return NextResponse.json({ success: false, error: 'Player not found in room' }, { status: 404 });
  }

  return NextResponse.json({ success: true, view: projection });
}
