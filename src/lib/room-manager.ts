// Core Room & Game State Manager with SSE broadcasting
import { GameRoom, Player, PlayerRole, GamePhase, ControlWidget, ActiveTask, SpectatorLog } from './types';
import { generateVisualPuzzle, generateCrisisEvent } from './puzzle-engine';
import { getPhaseForElapsed, GAME_DURATION_MS } from './phase-manager';
import { handleTaskSuccess, handleMistake, handleCrisisSuccess, handleCrisisFail, getEndgameSummary, clampUpload } from './score-manager';

// Global in-memory storage for rooms
const globalRooms: Record<string, GameRoom> = {};
const sseSubscribers: Record<string, Set<(room: GameRoom) => void>> = {};
const gameTickers: Record<string, NodeJS.Timeout> = {};

export function getOrCreateRoom(code: string, hostId: string = 'host', lanUrl?: string): GameRoom {
  const upperCode = code.toUpperCase();
  if (!globalRooms[upperCode]) {
    globalRooms[upperCode] = {
      code: upperCode,
      hostId,
      mode: '3_PLAYER',
      phase: 'LOBBY',
      startTime: null,
      endTime: null,
      elapsedMs: 0,
      players: {},
      uploadPercent: 0,
      chaosLevel: 10,
      comboCount: 0,
      maxCombo: 0,
      successfulTasks: 0,
      failedTasks: 0,
      activeTasks: [],
      controlWidgets: [],
      activeCrisis: null,
      spectatorLogs: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: Date.now(),
          text: 'Lobby opened. Scan QR code on your phone to join!',
          type: 'info'
        }
      ],
      spectatorHeadline: 'WAITING FOR PANICKED HUMANS TO SCAN QR...',
      verdict: null,
      hostLanUrl: lanUrl,
    };
  }
  return globalRooms[upperCode];
}

export function getRoom(code: string): GameRoom | null {
  return globalRooms[code.toUpperCase()] || null;
}

export function subscribeToRoom(code: string, callback: (room: GameRoom) => void): () => void {
  const upperCode = code.toUpperCase();
  if (!sseSubscribers[upperCode]) {
    sseSubscribers[upperCode] = new Set();
  }
  sseSubscribers[upperCode].add(callback);

  // Send current state immediately
  const room = getRoom(upperCode);
  if (room) {
    callback(room);
  }

  return () => {
    sseSubscribers[upperCode]?.delete(callback);
  };
}

export function broadcastRoomUpdate(code: string) {
  const upperCode = code.toUpperCase();
  const room = globalRooms[upperCode];
  if (!room) return;

  if (sseSubscribers[upperCode]) {
    sseSubscribers[upperCode].forEach((cb) => {
      try {
        cb(room);
      } catch (err) {
        console.error('Error in SSE subscriber broadcast:', err);
      }
    });
  }
}

export function addSpectatorLog(room: GameRoom, text: string, type: SpectatorLog['type'] = 'info') {
  room.spectatorLogs.unshift({
    id: `log_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
    text,
    type,
  });
  if (room.spectatorLogs.length > 25) {
    room.spectatorLogs.pop();
  }
}

/**
 * Adds or reconnects a player to the room
 */
export function joinPlayer(code: string, playerId: string, name: string): { player: Player; room: GameRoom } {
  const room = getOrCreateRoom(code);
  const playerIds = Object.keys(room.players);

  // Reconnection check
  if (room.players[playerId]) {
    room.players[playerId].isConnected = true;
    room.players[playerId].lastSeen = Date.now();
    addSpectatorLog(room, `🟡 ${name} reconnected!`, 'info');
    broadcastRoomUpdate(code);
    return { player: room.players[playerId], room };
  }

  // Assign role based on join order
  let role: PlayerRole = 'CONTROLS';
  let color: Player['color'] = 'yellow';

  if (playerIds.length === 0) {
    role = 'CONTROLS';
    color = 'yellow';
  } else if (playerIds.length === 1) {
    role = 'BLUEPRINTS';
    color = 'purple';
  } else {
    role = 'DIRECTIVES';
    color = 'blue';
  }

  const newPlayer: Player = {
    id: playerId,
    name: name.trim() || `Player ${playerIds.length + 1}`,
    role,
    color,
    isConnected: true,
    lastSeen: Date.now(),
    activeSubRole: role === 'BLUEPRINTS' ? 'BLUEPRINTS' : undefined,
  };

  room.players[playerId] = newPlayer;

  // Update mode automatically
  const totalCount = Object.keys(room.players).length;
  room.mode = totalCount <= 2 ? '2_PLAYER' : '3_PLAYER';

  addSpectatorLog(room, `${color === 'yellow' ? '🟡' : color === 'purple' ? '🟣' : '🔵'} ${newPlayer.name} joined as ${role}`, 'info');

  if (totalCount === 2) {
    room.spectatorHeadline = '2 PLAYERS READY! (Host can start now or wait for a 3rd)';
  } else if (totalCount >= 3) {
    room.spectatorHeadline = '3 PLAYERS READY! READY TO LAUNCH!';
  }

  broadcastRoomUpdate(code);
  return { player: newPlayer, room };
}

/**
 * Starts the game: 5s Briefing -> Phase 1
 */
export function startGame(code: string) {
  const room = getRoom(code);
  if (!room || room.phase !== 'LOBBY') return;

  const playerCount = Object.keys(room.players).length;
  if (playerCount < 2) return;

  room.mode = playerCount === 2 ? '2_PLAYER' : '3_PLAYER';
  room.phase = 'BRIEFING';
  room.uploadPercent = 0;
  room.chaosLevel = 15;
  room.comboCount = 0;
  room.maxCombo = 0;
  room.successfulTasks = 0;
  room.failedTasks = 0;
  room.spectatorHeadline = '5-SECOND BRIEFING: READ YOUR ROLES & PREPARE TO SHOUT!';
  addSpectatorLog(room, '🚨 BRIEFING STARTED: Review your job on your phone!', 'warning');

  broadcastRoomUpdate(code);

  // 5 seconds briefing timer
  setTimeout(() => {
    if (room.phase === 'BRIEFING') {
      room.phase = 'ORIENT';
      room.startTime = Date.now();
      room.elapsedMs = 0;
      room.spectatorHeadline = '11:58:45 — SUBMIT THE PROJECT BEFORE 11:59:59!';
      addSpectatorLog(room, '🔥 CLOCK IS TICKING! 75 SECONDS TO MIDNIGHT!', 'danger');

      // Populate initial tasks & widgets
      replenishTasks(room, 'easy', 1);

      // Start tick loop
      startRoomTicker(code);
      broadcastRoomUpdate(code);
    }
  }, 5000);
}

function replenishTasks(room: GameRoom, difficulty: 'easy' | 'medium' | 'hard', targetCount: number) {
  // Keep active uncompleted tasks
  room.activeTasks = room.activeTasks.filter((t) => !t.completed);

  while (room.activeTasks.length < targetCount) {
    const puzzle = generateVisualPuzzle(difficulty);
    room.activeTasks.push(puzzle.task);

    // Merge new widgets into controlWidgets (limit to 6 widgets on screen)
    const existingWidgetIds = new Set(room.controlWidgets.map((w) => w.id));
    const newWidgets = puzzle.widgets.filter((w) => !existingWidgetIds.has(w.id));
    room.controlWidgets = [...room.controlWidgets.slice(-3), ...newWidgets];
  }

  // For 2-player mode, auto-switch Player 2's subrole based on active task
  if (room.mode === '2_PLAYER') {
    const p2 = Object.values(room.players).find((p) => p.role === 'BLUEPRINTS');
    if (p2 && room.activeTasks.length > 0) {
      // Toggle role for variety
      p2.activeSubRole = p2.activeSubRole === 'BLUEPRINTS' ? 'DIRECTIVES' : 'BLUEPRINTS';
    }
  }
}

/**
 * The 500ms Game Engine Ticker
 */
function startRoomTicker(code: string) {
  if (gameTickers[code]) {
    clearInterval(gameTickers[code]);
  }

  gameTickers[code] = setInterval(() => {
    const room = getRoom(code);
    if (!room || room.phase === 'LOBBY' || room.phase === 'RESOLVED' || !room.startTime) {
      clearInterval(gameTickers[code]);
      delete gameTickers[code];
      return;
    }

    room.elapsedMs = Date.now() - room.startTime;

    // Check if 75s deadline has been crossed
    if (room.elapsedMs >= GAME_DURATION_MS) {
      finalizeGame(room, false);
      broadcastRoomUpdate(code);
      return;
    }

    // Determine current phase
    const schedule = getPhaseForElapsed(room.elapsedMs);
    const prevPhase = room.phase;
    room.phase = schedule.phase;

    // Phase transition announcements
    if (prevPhase !== room.phase) {
      addSpectatorLog(room, `⚡ ${schedule.label}`, 'warning');
      room.spectatorHeadline = schedule.subtext;

      if (room.phase === 'CRISIS' && !room.activeCrisis) {
        const playerCount = Object.keys(room.players).length;
        room.activeCrisis = generateCrisisEvent(playerCount);
        addSpectatorLog(room, '🚨 CRISIS TRIGGERED: ALL PLAYERS HOLD SYNC!', 'danger');
      }
    }

    // Handle Active Crisis Timeout
    if (room.activeCrisis && !room.activeCrisis.resolved) {
      const crisisElapsed = Date.now() - room.activeCrisis.startedAt;
      if (crisisElapsed > room.activeCrisis.durationMs) {
        // Crisis timed out / failed
        room.activeCrisis.resolved = true;
        const res = handleCrisisFail(room.uploadPercent, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;
        addSpectatorLog(room, res.message, 'danger');
        room.spectatorHeadline = '💀 CRISIS FAILED! Upload speed penalized!';
      }
    }

    // Ensure appropriate task density
    if (room.phase !== 'CRISIS' || (room.activeCrisis && room.activeCrisis.resolved)) {
      replenishTasks(room, schedule.difficulty, schedule.targetActiveTasks);
    }

    // Update Chaos Level
    room.chaosLevel = Math.min(100, Math.round((room.elapsedMs / GAME_DURATION_MS) * 100));

    // Dynamic Spectator Narrative ticker
    updateSpectatorNarrative(room);

    broadcastRoomUpdate(code);
  }, 500);
}

function updateSpectatorNarrative(room: GameRoom) {
  const remainingSec = Math.ceil((GAME_DURATION_MS - room.elapsedMs) / 1000);

  if (room.uploadPercent >= 85) {
    room.spectatorHeadline = `🔥 ${room.uploadPercent}% UPLOADED! ONE MORE PUSH!`;
  } else if (remainingSec <= 10) {
    room.spectatorHeadline = `🚨 FINAL 10 SECONDS! SOMEONE PRESS SOMETHING!`;
  } else if (room.comboCount >= 3) {
    room.spectatorHeadline = `💥 PANIC COMBO x${room.comboCount} — THEY ARE LOCKING IN!`;
  } else if (room.phase === 'CRISIS') {
    room.spectatorHeadline = `🚨 ALL PLAYERS: HOLD THE SYNC BUTTON TOGETHER!`;
  } else {
    const randomHints = [
      '🟡 Yellow has the switches! Listen to teammates!',
      '🟣 Purple has the blueprints! Read the safe path!',
      '🔵 Blue has the directive! Shout the sequence!',
    ];
    if (Math.random() < 0.2) {
      room.spectatorHeadline = randomHints[Math.floor(Math.random() * randomHints.length)];
    }
  }
}

/**
 * Processes participant player actions from mobile phones
 */
export function handlePlayerAction(
  code: string,
  playerId: string,
  action: {
    type: 'CONTROL_CHANGE' | 'CRISIS_HOLD_START' | 'CRISIS_HOLD_END';
    taskId?: string;
    actionId?: string;
    widgetId?: string;
    value?: any;
    clientTimestamp?: number;
  }
): { success: boolean; message: string; isVictory?: boolean } {
  const room = getRoom(code);
  if (!room || room.phase === 'LOBBY' || room.phase === 'RESOLVED') {
    return { success: false, message: 'Game not active or already resolved.' };
  }

  // Update player heartbeat
  if (room.players[playerId]) {
    room.players[playerId].lastSeen = Date.now();
    room.players[playerId].isConnected = true;
  }

  // Stale-action protection: check if targeted task is still active and valid
  if (action.taskId) {
    const taskExists = room.activeTasks.some((t) => t.id === action.taskId && !t.completed);
    if (!taskExists) {
      return { success: false, message: 'Task already expired or solved by teammate.' };
    }
  }

  // Handle Crisis Hold actions
  if (action.type === 'CRISIS_HOLD_START') {
    if (room.activeCrisis && !room.activeCrisis.resolved) {
      if (!room.activeCrisis.playersHolding.includes(playerId)) {
        room.activeCrisis.playersHolding.push(playerId);
      }
      const needed = Object.keys(room.players).length;
      if (room.activeCrisis.playersHolding.length >= needed) {
        // All players are holding! Success!
        room.activeCrisis.resolved = true;
        const res = handleCrisisSuccess(room.uploadPercent, room.comboCount, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;
        room.maxCombo = res.newMaxCombo;
        addSpectatorLog(room, res.message, 'success');

        if (res.isVictory) {
          finalizeGame(room, true);
        }
        broadcastRoomUpdate(code);
        return { success: true, message: res.message, isVictory: res.isVictory };
      }
      broadcastRoomUpdate(code);
      return { success: true, message: 'Holding sync button...' };
    }
  }

  if (action.type === 'CRISIS_HOLD_END') {
    if (room.activeCrisis) {
      room.activeCrisis.playersHolding = room.activeCrisis.playersHolding.filter((id) => id !== playerId);
      broadcastRoomUpdate(code);
      return { success: true, message: 'Released hold.' };
    }
  }

  // Handle Control Widget Interactions
  if (action.type === 'CONTROL_CHANGE' && action.widgetId) {
    const { widgetId, value } = action;

    // Find the widget on the board
    const widget = room.controlWidgets.find((w) => w.id === widgetId);
    if (widget) {
      widget.currentValue = value;
    }

    // Check if this action satisfies any active task
    const matchingTask = room.activeTasks.find((t) => t.targetWidgetId === widgetId && !t.completed);

    if (matchingTask) {
      // Validate expected value
      let isCorrect = false;
      if (widget?.type === 'ROTARY_DIAL') {
        isCorrect = Math.abs(Number(value) - Number(matchingTask.expectedValue)) <= 4;
      } else if (widget?.type === 'HOLD_LEVER') {
        isCorrect = Number(value) >= Number(matchingTask.expectedValue);
      } else {
        isCorrect = value === matchingTask.expectedValue;
      }

      if (isCorrect) {
        matchingTask.completed = true;
        room.successfulTasks++;
        const res = handleTaskSuccess(room.uploadPercent, room.comboCount, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;
        room.maxCombo = res.newMaxCombo;

        addSpectatorLog(room, `✅ ${matchingTask.title} SOLVED! ${res.message}`, 'success');

        // For 2-player fairness: toggle active sub-role sequentially so only 1 channel is active at a time
        if (room.mode === '2_PLAYER') {
          const p2 = Object.values(room.players).find((p) => p.role === 'BLUEPRINTS');
          if (p2) {
            p2.activeSubRole = p2.activeSubRole === 'BLUEPRINTS' ? 'DIRECTIVES' : 'BLUEPRINTS';
          }
        }

        if (res.isVictory) {
          finalizeGame(room, true);
        } else {
          // Replenish next task
          const schedule = getPhaseForElapsed(room.elapsedMs);
          replenishTasks(room, schedule.difficulty, schedule.targetActiveTasks);
        }

        broadcastRoomUpdate(code);
        return { success: true, message: res.message, isVictory: res.isVictory };
      } else {
        // Wrong setting / trap activated!
        room.failedTasks++;
        const res = handleMistake(room.uploadPercent, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;

        addSpectatorLog(room, `❌ MISTAKE ON ${widget?.label || 'CONTROL'}! ${res.message}`, 'danger');
        broadcastRoomUpdate(code);
        return { success: false, message: res.message };
      }
    } else {
      // Pressed an unrequested control or trap
      room.failedTasks++;
      const res = handleMistake(room.uploadPercent, room.maxCombo);
      room.uploadPercent = res.newUpload;
      room.comboCount = res.newCombo;

      addSpectatorLog(room, `⚠️ WRONG SWITCH HIT! ${res.message}`, 'danger');
      broadcastRoomUpdate(code);
      return { success: false, message: res.message };
    }
  }

  return { success: false, message: 'Invalid action.' };
}

/**
 * Atomically Finalizes the Game
 */
export function finalizeGame(room: GameRoom, isVictory: boolean) {
  room.phase = 'RESOLVED';
  room.endTime = Date.now();
  room.verdict = isVictory ? 'VICTORY' : 'EXPELLED';
  room.uploadPercent = isVictory ? 100 : clampUpload(room.uploadPercent);

  const elapsedSec = (room.endTime - (room.startTime || room.endTime)) / 1000;
  const summary = getEndgameSummary(isVictory, room.uploadPercent, room.maxCombo, elapsedSec);

  room.teamTitle = summary.title;
  room.spectatorHeadline = isVictory
    ? '🎉 PROJECT SUBMITTED AT 11:59:58! YOU SURVIVED!'
    : '💀 PORTAL CLOSED AT 11:59:59! EXPELLED!';

  addSpectatorLog(
    room,
    isVictory
      ? `🏆 VICTORY: Grade ${summary.grade} - ${summary.title}`
      : `💀 FAILED: Grade ${summary.grade} - ${summary.title}`,
    isVictory ? 'success' : 'danger'
  );
}

/**
 * Admin Stall Controls
 */
export function handleAdminCommand(
  code: string,
  command: 'RESET' | 'FORCE_WIN' | 'FORCE_LOSE' | 'SKIP_PHASE' | 'START_2P' | 'START_3P'
): GameRoom | null {
  const room = getRoom(code);
  if (!room) return null;

  switch (command) {
    case 'RESET':
      room.phase = 'LOBBY';
      room.startTime = null;
      room.endTime = null;
      room.elapsedMs = 0;
      room.uploadPercent = 0;
      room.chaosLevel = 10;
      room.comboCount = 0;
      room.activeTasks = [];
      room.controlWidgets = [];
      room.activeCrisis = null;
      room.verdict = null;
      room.spectatorHeadline = 'ROOM RESET. READY FOR NEXT CREW!';
      addSpectatorLog(room, '🔄 Room reset by host admin.', 'info');
      break;

    case 'FORCE_WIN':
      finalizeGame(room, true);
      break;

    case 'FORCE_LOSE':
      finalizeGame(room, false);
      break;

    case 'SKIP_PHASE':
      if (room.phase === 'ORIENT') room.elapsedMs = 15000;
      else if (room.phase === 'PRESSURE') room.elapsedMs = 35000;
      else if (room.phase === 'CRISIS') room.elapsedMs = 55000;
      else if (room.phase === 'MELTDOWN') room.elapsedMs = 65000;
      break;

    case 'START_2P':
    case 'START_3P':
      startGame(code);
      break;
  }

  broadcastRoomUpdate(code);
  return room;
}
