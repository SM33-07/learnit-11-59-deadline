import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, joinPlayer, startGame } from '@/lib/room-manager';
import { getLocalLanIp } from '@/lib/network-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, playerId, name, lanUrl } = body;

    const roomCode = (code || `PANIC${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();

    if (action === 'CREATE') {
      const room = getOrCreateRoom(roomCode, playerId || 'host', lanUrl);
      const lanIp = getLocalLanIp();
      return NextResponse.json({
        success: true,
        room,
        lanIp,
        defaultPort: 3000,
      });
    }

    if (action === 'JOIN') {
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
      }
      const { player, room } = joinPlayer(roomCode, playerId, name);
      return NextResponse.json({
        success: true,
        player,
        room,
      });
    }

    if (action === 'START') {
      startGame(roomCode);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const lanIp = getLocalLanIp();
  return NextResponse.json({ lanIp, port: 3000 });
}
