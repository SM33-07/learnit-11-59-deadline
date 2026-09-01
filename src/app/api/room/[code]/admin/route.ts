import { NextRequest, NextResponse } from 'next/server';
import { handleAdminCommand } from '@/lib/room-manager';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { command, hostToken } = body;

    const updatedRoom = handleAdminCommand(code, command, hostToken);
    if (!updatedRoom) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
