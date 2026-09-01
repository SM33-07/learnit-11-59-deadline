// Core types for 11:59: DEADLINE PANIC
// Server-Authoritative & Architecturally Isolated Asymmetric Information System

export type PlayerRole = 'CONTROLS' | 'BLUEPRINTS' | 'DIRECTIVES';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  color: 'yellow' | 'purple' | 'blue';
  isConnected: boolean;
  lastSeen: number;
  sessionToken: string;
  // In 2-player mode, Player 2's active channel is derived from active task
  activeSubRole?: 'BLUEPRINTS' | 'DIRECTIVES';
}

export type GamePhase = 
  | 'LOBBY'
  | 'BRIEFING'
  | 'ORIENT'       // 0–20s
  | 'PRESSURE'     // 20–45s
  | 'CRISIS'       // 45–65s
  | 'MELTDOWN'     // 65–80s
  | 'FINAL_CHECK'  // 80–90s
  | 'RESOLVED';

export type GameVerdict = 'VICTORY' | 'EXPELLED' | null;

export type ControlWidgetType = 
  | 'TOGGLE'
  | 'ROTARY_DIAL'
  | 'PUSH_BUTTON'
  | 'HOLD_LEVER'
  | 'SLIDER';

export interface ControlWidget {
  id: string;
  type: ControlWidgetType;
  label: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'amber';
  shape?: 'triangle' | 'square' | 'circle' | 'star' | 'bolt';
  currentValue: any;
  targetValue?: any;
  min?: number;
  max?: number;
  requiredHoldSeconds?: number;
}

export interface TaskDirective {
  shoutText: string;
  targetRole: PlayerRole;
  urgency: 'normal' | 'urgent' | 'critical';
}

export interface TaskBlueprint {
  title: string;
  dangerClue?: string;
  safePathClue?: string;
  codeClue?: string;
  visualDiagram?: {
    safeColor: string;
    trapColor: string;
    targetValue?: string | number;
  };
}

export type TaskStatus = 'ACTIVE' | 'RESOLVED_SUCCESS' | 'RESOLVED_FAILED' | 'EXPIRED';

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  targetWidgetId: string;
  expectedValue: any;
  directive: TaskDirective;
  blueprint: TaskBlueprint;
  assignedChannel: 'BLUEPRINTS' | 'DIRECTIVES';
  hint?: string;
  hintRevealed?: boolean;
  createdAt: number;
  durationMs: number;
  status: TaskStatus;
  completed: boolean;
}

export interface CrisisEvent {
  id: string;
  title: string;
  instruction: string;
  type: 'SYNC_HOLD' | 'COLOR_CHORD';
  requiredHoldMs: number;
  activePlayersNeeded: number;
  playersHolding: string[];
  holdStartedAt: number | null; // Exact timestamp when required set started holding
  startedAt: number;
  durationMs: number;
  resolved: boolean;
}

// -------------------------------------------------------------
// SANITIZED ASYMMETRIC PLAYER PROJECTIONS (ZERO LEAKAGE)
// -------------------------------------------------------------

export interface SanitizedWidget {
  id: string;
  type: ControlWidgetType;
  label: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'amber';
  shape?: 'triangle' | 'square' | 'circle' | 'star' | 'bolt';
  currentValue: any;
  min?: number;
  max?: number;
  requiredHoldSeconds?: number;
}

export interface SanitizedBlueprint {
  title: string;
  dangerClue?: string;
  safeClue?: string;
  safePathClue?: string;
  targetValueLabel?: string | number;
  hint?: string;
  hintRevealed?: boolean;
  remainingSec: number;
}

export interface SanitizedDirective {
  title: string;
  shoutText: string;
  urgency: 'normal' | 'urgent' | 'critical';
  hint?: string;
  hintRevealed?: boolean;
  remainingSec: number;
}

export interface SanitizedCrisis {
  id: string;
  title: string;
  instruction: string;
  requiredHoldMs: number;
  activePlayersNeeded: number;
  playersHolding: string[];
  holdProgressPercent: number; // 0 to 100%
  resolved: boolean;
}

export interface PlayerRoomView {
  code: string;
  phase: GamePhase;
  mode: '2_PLAYER' | '3_PLAYER';
  uploadPercent: number;
  elapsedMs: number;
  totalDurationMs: number;
  verdict: GameVerdict;
  myPlayer: {
    id: string;
    name: string;
    role: PlayerRole;
    color: 'yellow' | 'purple' | 'blue';
    activeSubRole?: 'BLUEPRINTS' | 'DIRECTIVES';
  };
  // Asymmetric fields:
  controlWidgets?: SanitizedWidget[];
  schematics?: SanitizedBlueprint[];
  directives?: SanitizedDirective[];
  crisis: SanitizedCrisis | null;
  activeTaskCount: number;
}

export interface PlayerActionPayload {
  sessionToken: string;
  playerId: string;
  type: 'CONTROL_CHANGE' | 'CRISIS_HOLD_START' | 'CRISIS_HOLD_END' | 'REQUEST_HINT' | 'HEARTBEAT';
  actionId?: string;
  widgetId?: string;
  value?: any;
  taskId?: string;
  clientTimestamp?: number;
}

export interface SpectatorLog {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'combo';
}

export interface GameRoom {
  code: string;
  hostId: string;
  mode: '2_PLAYER' | '3_PLAYER';
  phase: GamePhase;
  startTime: number | null;
  endTime: number | null;
  elapsedMs: number;
  
  // Players
  players: Record<string, Player>;
  
  // Metrics (Strictly 0-100%)
  uploadPercent: number;
  chaosLevel: number;
  comboCount: number;
  maxCombo: number;
  successfulTasks: number;
  failedTasks: number;
  
  // Dynamic State
  activeTasks: ActiveTask[];
  controlWidgets: ControlWidget[];
  activeCrisis: CrisisEvent | null;
  
  // Spectator Logs
  spectatorLogs: SpectatorLog[];
  spectatorHeadline: string;
  
  // Verdict
  verdict: GameVerdict;
  teamTitle?: string;
  teamScore?: number;
  
  // Server-Side Processed Actions Tracking (prevent replay/stale)
  processedActionIds: Set<string>;
  
  hostLanUrl?: string;
}
