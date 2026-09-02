import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateRoom, joinPlayer, startGame, proceedToGame, generateUniqueRoomCode, getPlayerProjection } from '@/lib/room-manager';
import { getLocalLanIp } from '@/lib/network-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, playerId, name, lanUrl, hostToken } = body;

    const roomCode = (code && code.trim() ? code.trim() : generateUniqueRoomCode()).toUpperCase();

    if (action === 'CREATE') {
      const room = getOrCreateRoom(roomCode, playerId || 'host', lanUrl, hostToken);
      const lanIp = getLocalLanIp();
      return NextResponse.json({
        success: true,
        room,
        code: roomCode,
        hostToken: room.hostToken,
        lanIp,
        defaultPort: 3000,
      });
    }

    if (action === 'JOIN') {
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
      }
      const { player, room } = joinPlayer(roomCode, playerId, name);
      const view = getPlayerProjection(room, player.id);

      // Return ONLY sanitized player view and session token (NEVER raw room)
      return NextResponse.json({
        success: true,
        player,
        sessionToken: player.sessionToken,
        view,
      });
    }

    if (action === 'START') {
      startGame(roomCode, hostToken);
      return NextResponse.json({ success: true });
    }

    if (action === 'PROCEED') {
      proceedToGame(roomCode, hostToken);
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
