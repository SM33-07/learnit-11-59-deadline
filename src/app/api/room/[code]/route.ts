import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/room-manager';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = (code || '').trim().toUpperCase();
  const room = getRoom(upperCode);
  
  if (!room) {
    return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true, room });
}
