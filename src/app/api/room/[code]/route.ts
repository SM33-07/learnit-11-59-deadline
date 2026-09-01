import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getOrCreateRoom } from '@/lib/room-manager';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = getRoom(code) || getOrCreateRoom(code);
  return NextResponse.json({ success: true, room });
}
