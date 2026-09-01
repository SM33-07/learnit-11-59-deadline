import { NextRequest, NextResponse } from 'next/server';
import { handlePlayerAction } from '@/lib/room-manager';

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { playerId, action } = body;

    if (!playerId || !action) {
      return NextResponse.json({ success: false, error: 'Missing playerId or action' }, { status: 400 });
    }

    const result = handlePlayerAction(code, playerId, action);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
