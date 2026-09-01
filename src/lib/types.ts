// Core types for 11:59: DEADLINE PANIC

export type PlayerRole = 'CONTROLS' | 'BLUEPRINTS' | 'DIRECTIVES';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  color: 'yellow' | 'purple' | 'blue';
  isConnected: boolean;
  lastSeen: number;
  // In 2-player mode, Player 2 has auto-switching active role
  activeSubRole?: 'BLUEPRINTS' | 'DIRECTIVES';
}

export type GamePhase = 
  | 'LOBBY'
  | 'BRIEFING'     // 5s pre-game role briefing
  | 'ORIENT'       // 0–15s: 1 simple task
  | 'PRESSURE'     // 15–35s: 2 overlapping tasks
  | 'CRISIS'       // 35–55s: Coordinated team boss event
  | 'MELTDOWN'     // 55–65s: Rapid-fire 4s directives
  | 'FINAL_CHECK'  // 65–75s: Final submission sprint
  | 'RESOLVED';    // Game ended (VICTORY / EXPELLED)

export type GameVerdict = 'VICTORY' | 'EXPELLED' | null;

export type ControlWidgetType = 
  | 'TOGGLE'       // 2-state toggle switch (e.g. Yellow, Blue, Red, Green)
  | 'ROTARY_DIAL'  // 0-100 dial target
  | 'PUSH_BUTTON'  // Color/Shape buttons
  | 'HOLD_LEVER'   // Hold down for N seconds
  | 'SLIDER'       // Multi-position slider (e.g. 10%, 40%, 75%, 100%)
  | 'KEYPAD';      // 3-digit pin code entry

export interface ControlWidget {
  id: string;
  type: ControlWidgetType;
  label: string;
  color: 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'amber';
  shape?: 'triangle' | 'square' | 'circle' | 'star' | 'bolt';
  currentValue: any;
  targetValue?: any;
  options?: string[];
  min?: number;
  max?: number;
  requiredHoldSeconds?: number;
}

export interface TaskDirective {
  shoutText: string;
  targetRole: PlayerRole;
  urgency: 'normal' | 'urgent' | 'critical';
  timeRemainingSec?: number;
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

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  targetWidgetId: string;
  expectedValue: any;
  directive: TaskDirective;
  blueprint: TaskBlueprint;
  createdAt: number;
  durationMs: number;
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
  startedAt: number;
  durationMs: number;
  resolved: boolean;
}

export interface PlayerActionPayload {
  type: 'CONTROL_CHANGE' | 'CRISIS_HOLD_START' | 'CRISIS_HOLD_END';
  taskId?: string;
  actionId?: string;
  widgetId?: string;
  value?: any;
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
  
  // Game Metrics (Strictly clamped 0-100%)
  uploadPercent: number;
  chaosLevel: number; // 0-100%
  comboCount: number;
  maxCombo: number;
  successfulTasks: number;
  failedTasks: number;
  
  // Dynamic Tasks & Active State
  activeTasks: ActiveTask[];
  controlWidgets: ControlWidget[];
  activeCrisis: CrisisEvent | null;
  
  // Narrative Spectator Ticker
  spectatorLogs: SpectatorLog[];
  spectatorHeadline: string;
  
  // Verdict
  verdict: GameVerdict;
  teamTitle?: string;
  teamScore?: number;
  
  // LAN / Network info
  hostLanUrl?: string;
}
