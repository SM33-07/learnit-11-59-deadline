import { NextRequest, NextResponse } from 'next/server';
import { handlePlayerAction } from '@/lib/room-manager';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await req.json();
    const playerId = body.playerId;
    const actionPayload = body.action || body;

    if (!playerId || !actionPayload.type) {
      return NextResponse.json({ success: false, error: 'Missing playerId or action' }, { status: 400 });
    }

    const result = handlePlayerAction(code, playerId, actionPayload);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
