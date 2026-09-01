// Core Room & Game State Manager with Server-Authoritative Engine and Asymmetric Projections
import {
  GameRoom,
  Player,
  PlayerRole,
  GamePhase,
  ControlWidget,
  ActiveTask,
  SpectatorLog,
  PlayerRoomView,
  SanitizedWidget,
  SanitizedBlueprint,
  SanitizedDirective,
  SanitizedCrisis,
  PlayerActionPayload
} from './types';
import { generateVisualPuzzle, generateCrisisEvent } from './puzzle-engine';
import { getPhaseForElapsed, GAME_DURATION_MS } from './phase-manager';
import {
  handleTaskSuccess,
  handleMistake,
  handleTaskTimeout,
  handleCrisisSuccess,
  handleCrisisFail,
  getEndgameSummary,
  clampUpload,
  SCORE_RULES
} from './score-manager';

// Global in-memory storage for rooms
const globalRooms: Record<string, GameRoom> = {};
const sseSubscribers: Record<string, Set<(data: any) => void>> = {};
const sseSubscriberMap: Record<string, Map<(data: any) => void, string>> = {}; // Maps callback -> playerId or 'host'
const gameTickers: Record<string, NodeJS.Timeout> = {};

export function generateUniqueRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `PANIC${rand}`;
  } while (globalRooms[code]);
  return code;
}

export function getOrCreateRoom(code: string, hostId: string = 'host', lanUrl?: string): GameRoom {
  const upperCode = code.toUpperCase();
  if (!globalRooms[upperCode]) {
    const hostToken = `ht_${Math.random().toString(36).substring(2, 14)}_${Date.now()}`;
    globalRooms[upperCode] = {
      code: upperCode,
      hostId,
      hostToken,
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
      spectatorHeadline: 'WAITING FOR SQUAD TO SCAN QR...',
      verdict: null,
      processedActionIds: new Set<string>(),
      hostLanUrl: lanUrl,
    };
  }
  return globalRooms[upperCode];
}

export function getRoom(code: string): GameRoom | null {
  return globalRooms[code.toUpperCase()] || null;
}

// -------------------------------------------------------------
// ASYMMETRIC STATE PROJECTION (ZERO SECRET LEAKAGE)
// -------------------------------------------------------------

export function getPlayerProjection(room: GameRoom, playerId: string): PlayerRoomView | null {
  const player = room.players[playerId];
  if (!player) return null;

  const now = Date.now();
  const is2Player = room.mode === '2_PLAYER';
  const primaryTask = room.activeTasks.find((t) => !t.completed);

  // Derive active sub-role for Player 2 in 2P mode deterministically from active task
  const activeSubRole: 'BLUEPRINTS' | 'DIRECTIVES' = is2Player
    ? primaryTask?.assignedChannel || 'BLUEPRINTS'
    : player.role === 'BLUEPRINTS'
    ? 'BLUEPRINTS'
    : 'DIRECTIVES';

  // Sanitized Crisis Projection
  let sanitizedCrisis: SanitizedCrisis | null = null;
  if (room.activeCrisis && !room.activeCrisis.resolved) {
    const holdStartedAt = room.activeCrisis.holdStartedAt;
    const holdDuration = holdStartedAt ? Math.max(0, now - holdStartedAt) : 0;
    const holdProgressPercent = Math.min(100, Math.round((holdDuration / room.activeCrisis.requiredHoldMs) * 100));

    sanitizedCrisis = {
      id: room.activeCrisis.id,
      title: room.activeCrisis.title,
      instruction: room.activeCrisis.instruction,
      requiredHoldMs: room.activeCrisis.requiredHoldMs,
      activePlayersNeeded: room.activeCrisis.activePlayersNeeded,
      requiredPlayerIds: room.activeCrisis.requiredPlayerIds,
      playersHolding: room.activeCrisis.playersHolding,
      holdProgressPercent,
      resolved: room.activeCrisis.resolved,
    };
  }

  // Base view
  const view: PlayerRoomView = {
    code: room.code,
    phase: room.phase,
    mode: room.mode,
    uploadPercent: room.uploadPercent,
    elapsedMs: room.elapsedMs,
    totalDurationMs: GAME_DURATION_MS,
    verdict: room.verdict,
    myPlayer: {
      id: player.id,
      name: player.name,
      role: player.role,
      color: player.color,
      activeSubRole,
    },
    crisis: sanitizedCrisis,
    activeTaskCount: room.activeTasks.filter((t) => !t.completed).length,
  };

  // 1. Controls Role Projection (Only interactive widgets, NO targetValue, NO expectedValue)
  if (player.role === 'CONTROLS') {
    // Derive from all active tasks
    const allWidgets = room.activeTasks.filter((t) => !t.completed).flatMap((t) => t.widgets || []);
    view.controlWidgets = (allWidgets.length > 0 ? allWidgets : room.controlWidgets).map((w): SanitizedWidget => ({
      id: w.id,
      type: w.type,
      label: w.label,
      color: w.color,
      shape: w.shape,
      currentValue: w.currentValue,
      min: w.min,
      max: w.max,
      requiredHoldSeconds: w.requiredHoldSeconds,
    }));
  }

  // 2. Blueprints Role Projection (Only safe/danger schematic clues, NO widget IDs)
  if (player.role === 'BLUEPRINTS' || (is2Player && activeSubRole === 'BLUEPRINTS')) {
    view.schematics = room.activeTasks
      .filter((t) => !t.completed)
      .map((t): SanitizedBlueprint => {
        const remainingMs = Math.max(0, t.durationMs - (now - t.createdAt));
        return {
          title: t.blueprint.title,
          safeClue: t.blueprint.safePathClue,
          dangerClue: t.blueprint.dangerClue,
          targetValueLabel: t.blueprint.visualDiagram?.targetValue,
          hint: t.hintRevealed ? t.hint : undefined,
          hintRevealed: t.hintRevealed,
          remainingSec: Math.ceil(remainingMs / 1000),
        };
      });
  }

  // 3. Directives Role Projection (Only shouting instructions, NO control widgets)
  if (player.role === 'DIRECTIVES' || (is2Player && activeSubRole === 'DIRECTIVES')) {
    view.directives = room.activeTasks
      .filter((t) => !t.completed)
      .map((t): SanitizedDirective => {
        const remainingMs = Math.max(0, t.durationMs - (now - t.createdAt));
        return {
          title: t.title,
          shoutText: t.directive.shoutText,
          urgency: t.directive.urgency,
          hint: t.hintRevealed ? t.hint : undefined,
          hintRevealed: t.hintRevealed,
          remainingSec: Math.ceil(remainingMs / 1000),
        };
      });
  }

  return view;
}

// -------------------------------------------------------------
// REAL-TIME SSE SUBSCRIPTION & BROADCASTING
// -------------------------------------------------------------

export function subscribeToRoom(
  code: string,
  target: string | 'host',
  callback: (data: GameRoom | PlayerRoomView) => void
): () => void {
  const upperCode = code.toUpperCase();
  if (!sseSubscribers[upperCode]) {
    sseSubscribers[upperCode] = new Set();
    sseSubscriberMap[upperCode] = new Map();
  }

  sseSubscribers[upperCode].add(callback);
  sseSubscriberMap[upperCode].set(callback, target);

  // Send initial state immediately
  const room = getRoom(upperCode);
  if (room) {
    if (target === 'host') {
      callback(room);
    } else {
      const projection = getPlayerProjection(room, target);
      if (projection) callback(projection);
    }
  }

  return () => {
    sseSubscribers[upperCode]?.delete(callback);
    sseSubscriberMap[upperCode]?.delete(callback);
  };
}

export function broadcastRoomUpdate(code: string) {
  const upperCode = code.toUpperCase();
  const room = globalRooms[upperCode];
  if (!room) return;

  if (sseSubscribers[upperCode]) {
    sseSubscribers[upperCode].forEach((cb) => {
      try {
        const target = sseSubscriberMap[upperCode]?.get(cb) || 'host';
        if (target === 'host') {
          cb(room);
        } else {
          const projection = getPlayerProjection(room, target);
          if (projection) {
            cb(projection);
          }
        }
      } catch (err) {
        console.error('Error in SSE broadcast callback:', err);
      }
    });
  }
}

export function addSpectatorLog(room: GameRoom, text: string, type: SpectatorLog['type'] = 'info') {
  room.spectatorLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    text,
    type,
  });
  if (room.spectatorLogs.length > 25) {
    room.spectatorLogs = room.spectatorLogs.slice(0, 25);
  }
}

// -------------------------------------------------------------
// PLAYER JOIN & SESSION MANAGEMENT
// -------------------------------------------------------------

export function joinPlayer(code: string, playerId: string, name: string): { player: Player; room: GameRoom } {
  const upperCode = code.toUpperCase();
  const room = getOrCreateRoom(upperCode);

  // Clean reconnect: existing player keeps identity and role
  if (room.players[playerId]) {
    room.players[playerId].name = name;
    room.players[playerId].isConnected = true;
    room.players[playerId].lastSeen = Date.now();
    broadcastRoomUpdate(upperCode);
    return { player: room.players[playerId], room };
  }

  // Strict room capacity: Max 3 players
  const playerIds = Object.keys(room.players);
  if (playerIds.length >= 3) {
    throw new Error('Room is at full capacity (3 players maximum).');
  }

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

  // Generate lightweight session token
  const sessionToken = `st_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

  const newPlayer: Player = {
    id: playerId,
    name: name.trim().substring(0, 16),
    role,
    color,
    isConnected: true,
    lastSeen: Date.now(),
    sessionToken,
    activeSubRole: role === 'BLUEPRINTS' ? 'BLUEPRINTS' : undefined,
  };

  room.players[playerId] = newPlayer;
  addSpectatorLog(room, `🎮 ${newPlayer.name} joined as ${role} (${color.toUpperCase()})`, 'info');

  broadcastRoomUpdate(upperCode);
  return { player: newPlayer, room };
}

// -------------------------------------------------------------
// GAMEPLAY LAUNCH & TIMELINE TICKER
// -------------------------------------------------------------

export function startGame(code: string, hostToken?: string) {
  const upperCode = code.toUpperCase();
  const room = getRoom(upperCode);
  if (!room || (room.phase !== 'LOBBY' && room.phase !== 'BRIEFING')) return;

  // Verify hostToken if provided
  if (hostToken && room.hostToken && hostToken !== room.hostToken) {
    throw new Error('Unauthorized host credential.');
  }

  const activeCount = Math.min(3, Math.max(2, Object.values(room.players).filter((p) => p.isConnected).length));
  if (activeCount < 2) return;

  room.mode = activeCount === 2 ? '2_PLAYER' : '3_PLAYER';
  room.phase = 'ORIENT';
  room.startTime = Date.now();
  room.elapsedMs = 0;
  room.uploadPercent = 0;
  room.chaosLevel = 10;
  room.comboCount = 0;
  room.maxCombo = 0;
  room.successfulTasks = 0;
  room.failedTasks = 0;
  room.spectatorHeadline = '11:58:30 — 90 SECONDS TO MIDNIGHT! SUBMIT THE PROJECT!';
  addSpectatorLog(room, '🔥 DEADLINE CLOCK ACTIVE! 90 SECONDS TO 11:59:59!', 'danger');

  // Populate initial task (strict 1 task for 2P and Orient)
  replenishTasks(room, 'easy', 1);

  // Start server-authoritative tick loop
  startRoomTicker(upperCode);
  broadcastRoomUpdate(upperCode);
}

export function proceedToGame(code: string, hostToken?: string) {
  startGame(code, hostToken);
}

function replenishTasks(room: GameRoom, difficulty: 'easy' | 'medium' | 'hard', targetCount: number) {
  room.activeTasks = room.activeTasks.filter((t) => !t.completed);

  // Hard rule for 2-Player mode: strictly 1 active task at a time to prevent role ambiguity
  const effectiveTarget = room.mode === '2_PLAYER' ? 1 : targetCount;

  while (room.activeTasks.length < effectiveTarget) {
    const puzzle = generateVisualPuzzle(difficulty, room.activeTasks.length);
    room.activeTasks.push(puzzle.task);
  }

  // Derive active widgets from all currently active tasks
  room.controlWidgets = room.activeTasks.filter((t) => !t.completed).flatMap((t) => t.widgets || []);
}

export function startRoomTicker(code: string) {
  const upperCode = code.toUpperCase();
  if (gameTickers[upperCode]) {
    clearInterval(gameTickers[upperCode]);
  }

  gameTickers[upperCode] = setInterval(() => {
    const room = globalRooms[upperCode];
    if (!room || room.phase === 'LOBBY' || room.phase === 'RESOLVED') {
      clearInterval(gameTickers[upperCode]);
      delete gameTickers[upperCode];
      return;
    }

    const now = Date.now();
    const elapsed = now - (room.startTime || now);
    room.elapsedMs = elapsed;

    // 1. Connection Heartbeat Monitor & Crisis Holder Cleanup
    Object.values(room.players).forEach((p) => {
      if (p.isConnected && now - p.lastSeen > 8000) {
        p.isConnected = false;
        addSpectatorLog(room, `⚠️ ${p.name} disconnected!`, 'warning');
        if (room.activeCrisis) {
          room.activeCrisis.playersHolding = room.activeCrisis.playersHolding.filter((id) => id !== p.id);
          room.activeCrisis.holdStartedAt = null; // Reset hold if disconnected holder was active
        }
      }
    });

    // 2. Deadline Expiry Check
    if (elapsed >= GAME_DURATION_MS) {
      finalizeGame(room, false);
      return;
    }

    // 3. Phase Transition Evaluation
    const schedule = getPhaseForElapsed(elapsed);
    if (room.phase !== schedule.phase) {
      room.phase = schedule.phase;
      room.spectatorHeadline = `${schedule.label} — ${schedule.subtext}`;
      addSpectatorLog(room, `⚡ ${schedule.label}: ${schedule.subtext}`, 'warning');

      if (room.phase === 'CRISIS' && !room.activeCrisis) {
        const activeIds = Object.values(room.players).filter((p) => p.isConnected).map((p) => p.id);
        room.activeCrisis = generateCrisisEvent(activeIds);
      }
    }

    // 4. Real Task Expiration Check (Server-authoritative expiry)
    let tasksChanged = false;
    for (const task of room.activeTasks) {
      if (!task.completed && now >= task.createdAt + task.durationMs) {
        task.status = 'EXPIRED';
        task.completed = true;
        room.failedTasks++;
        const res = handleTaskTimeout(room.uploadPercent, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;
        addSpectatorLog(room, `⏳ ${task.title} TIMED OUT! ${res.message}`, 'danger');
        tasksChanged = true;
      }
    }

    if (tasksChanged) {
      replenishTasks(room, schedule.difficulty, schedule.targetActiveTasks);
    }

    // 5. Exact Simultaneous Crisis Hold Evaluation (Exact Required Player Set)
    if (room.activeCrisis && !room.activeCrisis.resolved) {
      const crisis = room.activeCrisis;
      const required = crisis.requiredPlayerIds;
      const allRequiredHolding = required.length > 0 && required.every((id) => crisis.playersHolding.includes(id));

      if (allRequiredHolding) {
        if (!crisis.holdStartedAt) {
          crisis.holdStartedAt = now;
        } else if (now - crisis.holdStartedAt >= crisis.requiredHoldMs) {
          // Exactly 3.0 seconds continuous hold completed!
          crisis.resolved = true;
          const res = handleCrisisSuccess(room.uploadPercent, room.comboCount, room.maxCombo);
          room.uploadPercent = res.newUpload;
          room.comboCount = res.newCombo;
          room.maxCombo = res.newMaxCombo;
          addSpectatorLog(room, res.message, 'success');

          if (res.isVictory) {
            finalizeGame(room, true);
            return;
          }
        }
      } else {
        // Required set broken -> reset hold timer
        crisis.holdStartedAt = null;
      }
    }

    // Replenish active tasks if needed
    replenishTasks(room, schedule.difficulty, schedule.targetActiveTasks);

    broadcastRoomUpdate(upperCode);
  }, 250);
}

// -------------------------------------------------------------
// SERVER-AUTHORITATIVE ACTION HANDLER
// -------------------------------------------------------------

export function handlePlayerAction(
  code: string,
  playerId: string,
  payload: PlayerActionPayload
): { success: boolean; message: string; isVictory?: boolean; error?: string } {
  const upperCode = code.toUpperCase();
  const room = getRoom(upperCode);
  if (!room || room.phase === 'LOBBY' || room.phase === 'RESOLVED') {
    return { success: false, message: 'Game not active or already resolved.', error: 'Game not active' };
  }

  const player = room.players[playerId];
  if (!player) {
    return { success: false, message: 'Unrecognized player ID.', error: 'Player not found' };
  }

  // Verify Session Token
  if (payload.sessionToken && player.sessionToken && payload.sessionToken !== player.sessionToken) {
    return { success: false, message: 'Invalid session token.', error: 'Unauthorized session' };
  }

  // Update heartbeat
  player.lastSeen = Date.now();
  player.isConnected = true;

  // Stale / Duplicate Action Protection
  if (payload.actionId) {
    if (room.processedActionIds.has(payload.actionId)) {
      return { success: false, message: 'Duplicate action rejected.', error: 'Duplicate action' };
    }
    room.processedActionIds.add(payload.actionId);
  }

  // 1. Heartbeat Ping
  if (payload.type === 'HEARTBEAT') {
    return { success: true, message: 'Heartbeat acknowledged' };
  }

  // 2. Hint Request Action (-3% Upload Penalty)
  if (payload.type === 'REQUEST_HINT') {
    const task = room.activeTasks.find((t) => !t.completed);
    if (task && !task.hintRevealed) {
      task.hintRevealed = true;
      room.uploadPercent = clampUpload(room.uploadPercent - SCORE_RULES.HINT_PENALTY_UPLOAD);
      addSpectatorLog(room, `💡 Hint revealed for ${task.title}! (-${SCORE_RULES.HINT_PENALTY_UPLOAD}% Upload)`, 'warning');
      broadcastRoomUpdate(upperCode);
      return { success: true, message: 'Hint revealed (-3% Upload Penalty)' };
    }
    return { success: true, message: 'Hint already visible' };
  }

  // 3. Synchronized Crisis Hold Actions
  if (payload.type === 'CRISIS_HOLD_START') {
    if (room.activeCrisis && !room.activeCrisis.resolved) {
      if (!room.activeCrisis.playersHolding.includes(playerId)) {
        room.activeCrisis.playersHolding.push(playerId);
        // Reset hold timer since set changed
        const required = room.activeCrisis.requiredPlayerIds;
        const allHolding = required.length > 0 && required.every((id) => room.activeCrisis!.playersHolding.includes(id));
        room.activeCrisis.holdStartedAt = allHolding ? Date.now() : null;
      }
      broadcastRoomUpdate(upperCode);
      return { success: true, message: 'Holding emergency sync...' };
    }
  }

  if (payload.type === 'CRISIS_HOLD_END') {
    if (room.activeCrisis) {
      room.activeCrisis.playersHolding = room.activeCrisis.playersHolding.filter((id) => id !== playerId);
      room.activeCrisis.holdStartedAt = null; // Set broken
      broadcastRoomUpdate(upperCode);
      return { success: true, message: 'Released hold.' };
    }
  }

  // 4. Control Widget Interactions (Strict Role Authorization)
  if (payload.type === 'CONTROL_CHANGE' && payload.widgetId) {
    // Strict Authorization: Only Controls role (or 2P player 1) may touch hardware
    if (player.role !== 'CONTROLS') {
      return { success: false, message: 'Unauthorized role action. Only Controls player can operate switches.', error: 'Unauthorized role' };
    }

    const { widgetId, value } = payload;
    const allWidgets = room.activeTasks.filter((t) => !t.completed).flatMap((t) => t.widgets || []);
    const widget = (allWidgets.length > 0 ? allWidgets : room.controlWidgets).find((w) => w.id === widgetId);
    if (widget) {
      widget.currentValue = value;
    }

    // Match against primary active uncompleted task
    const matchingTask = room.activeTasks.find((t) => !t.completed && (t.targetWidgetId === widgetId || t.targetWidgetId.startsWith(widgetId)));

    if (matchingTask) {
      // Validate expected value
      let isCorrect = false;
      if (widget?.type === 'ROTARY_DIAL') {
        isCorrect = Math.abs(Number(value) - Number(matchingTask.expectedValue)) <= 2;
      } else if (widget?.type === 'HOLD_LEVER') {
        isCorrect = Number(value) >= Number(matchingTask.expectedValue);
      } else {
        isCorrect = value === matchingTask.expectedValue;
      }

      if (isCorrect) {
        // Single-Resolution Guarantee: Mark SUCCESS immediately
        matchingTask.status = 'RESOLVED_SUCCESS';
        matchingTask.completed = true;
        room.successfulTasks++;
        const res = handleTaskSuccess(room.uploadPercent, room.comboCount, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;
        room.maxCombo = res.newMaxCombo;
        addSpectatorLog(room, `✅ ${matchingTask.title} SOLVED! ${res.message}`, 'success');

        if (res.isVictory) {
          finalizeGame(room, true);
          return { success: true, message: res.message, isVictory: true };
        }

        // Replenish fresh task immediately
        const schedule = getPhaseForElapsed(room.elapsedMs);
        replenishTasks(room, schedule.difficulty, schedule.targetActiveTasks);
        broadcastRoomUpdate(upperCode);
        return { success: true, message: res.message };
      } else {
        // Single-Resolution Guarantee: Mark FAILED immediately and advance
        matchingTask.status = 'RESOLVED_FAILED';
        matchingTask.completed = true;
        room.failedTasks++;
        const res = handleMistake(room.uploadPercent, room.maxCombo);
        room.uploadPercent = res.newUpload;
        room.comboCount = res.newCombo;
        addSpectatorLog(room, `❌ ${matchingTask.title} FAILED! ${res.message}`, 'danger');

        // Replenish fresh task immediately to avoid stuck penalty loop
        const schedule = getPhaseForElapsed(room.elapsedMs);
        replenishTasks(room, schedule.difficulty, schedule.targetActiveTasks);
        broadcastRoomUpdate(upperCode);
        return { success: false, message: res.message };
      }
    }
  }

  return { success: true, message: 'Action processed' };
}

// -------------------------------------------------------------
// ENDGAME RESOLUTION & VICTORY ATOMICITY
// -------------------------------------------------------------

export function finalizeGame(room: GameRoom, isVictory: boolean) {
  if (room.phase === 'RESOLVED') return; // Idempotent

  room.phase = 'RESOLVED';
  room.endTime = Date.now();
  room.verdict = isVictory ? 'VICTORY' : 'EXPELLED';

  if (gameTickers[room.code]) {
    clearInterval(gameTickers[room.code]);
    delete gameTickers[room.code];
  }

  const elapsedSec = (room.endTime - (room.startTime || room.endTime)) / 1000;
  const summary = getEndgameSummary(isVictory, room.uploadPercent, room.maxCombo, elapsedSec);
  room.teamTitle = summary.title;

  if (isVictory) {
    room.uploadPercent = 100;
    room.spectatorHeadline = `SUBMISSION ACCEPTED! GRADE: ${summary.grade}`;
    addSpectatorLog(room, `🏆 PROJECT SUBMITTED! Grade: ${summary.grade}`, 'success');
  } else {
    room.spectatorHeadline = `11:59:59 — DEADLINE MISSED! GRADE: ${summary.grade}`;
    addSpectatorLog(room, `💀 DEADLINE MISSED! Grade: ${summary.grade}`, 'danger');
  }

  broadcastRoomUpdate(room.code);
}

export function handleAdminCommand(code: string, command: string, hostToken?: string): GameRoom | null {
  const upperCode = code.toUpperCase();
  const room = getRoom(upperCode);
  if (!room) return null;

  if (hostToken && room.hostToken && hostToken !== room.hostToken) {
    throw new Error('Unauthorized host credential.');
  }

  if (command === 'RESET') {
    return resetRoom(upperCode);
  }

  if (command === 'FORCE_WIN') {
    finalizeGame(room, true);
    return room;
  }

  if (command === 'FORCE_FAIL') {
    finalizeGame(room, false);
    return room;
  }

  if (command === 'TRIGGER_CRISIS') {
    const activeIds = Object.values(room.players).filter((p) => p.isConnected).map((p) => p.id);
    room.phase = 'CRISIS';
    room.activeCrisis = generateCrisisEvent(activeIds);
    addSpectatorLog(room, '🚨 ADMIN: Triggered emergency crisis event!', 'danger');
    broadcastRoomUpdate(upperCode);
    return room;
  }

  if (command === 'SKIP_PHASE') {
    const now = Date.now();
    const currentElapsed = room.elapsedMs;
    const schedule = getPhaseForElapsed(currentElapsed);
    room.startTime = (room.startTime || now) - (schedule.endMs - currentElapsed + 1000);
    broadcastRoomUpdate(upperCode);
    return room;
  }

  return room;
}

export function resetRoom(code: string): GameRoom {
  const upperCode = code.toUpperCase();
  if (gameTickers[upperCode]) {
    clearInterval(gameTickers[upperCode]);
    delete gameTickers[upperCode];
  }
  const oldHostToken = globalRooms[upperCode]?.hostToken;
  delete globalRooms[upperCode];
  const fresh = getOrCreateRoom(upperCode);
  if (oldHostToken) fresh.hostToken = oldHostToken;
  broadcastRoomUpdate(upperCode);
  return fresh;
}
