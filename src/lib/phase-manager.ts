// Phase & Escalation Timeline Manager (90s duration, millisecond accurate)
import { GamePhase } from './types';

export const GAME_DURATION_MS = 90000; // 90 seconds total

export interface PhaseSchedule {
  phase: GamePhase;
  startMs: number;
  endMs: number;
  label: string;
  subtext: string;
  targetActiveTasks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const PHASE_SCHEDULES: PhaseSchedule[] = [
  {
    phase: 'ORIENT',
    startMs: 0,
    endMs: 20000,
    label: 'PHASE 1: ORIENTATION (0-20s)',
    subtext: 'Get your bearings! 1 task at a time. Shout clearly!',
    targetActiveTasks: 1,
    difficulty: 'easy',
  },
  {
    phase: 'PRESSURE',
    startMs: 20000,
    endMs: 45000,
    label: 'PHASE 2: PRESSURE RISING (20-45s)',
    subtext: 'Multiple warnings incoming! Keep the upload moving!',
    targetActiveTasks: 2,
    difficulty: 'medium',
  },
  {
    phase: 'CRISIS',
    startMs: 45000,
    endMs: 65000,
    label: 'PHASE 3: CAMPUS CRISIS (45-65s)',
    subtext: 'MAJOR SYSTEM FAILURE! ALL PLAYERS COORDINATE NOW!',
    targetActiveTasks: 1,
    difficulty: 'hard',
  },
  {
    phase: 'MELTDOWN',
    startMs: 65000,
    endMs: 80000,
    label: 'PHASE 4: TOTAL MELTDOWN (65-80s)',
    subtext: 'PORTAL LOCKING DOWN! RAPID-FIRE ACTIONS!',
    targetActiveTasks: 2,
    difficulty: 'hard',
  },
  {
    phase: 'FINAL_CHECK',
    startMs: 80000,
    endMs: 90000,
    label: 'PHASE 5: FINAL SECONDS (80-90s)',
    subtext: '11:59:50! LAST CHANCE TO HIT 100%!',
    targetActiveTasks: 1,
    difficulty: 'hard',
  },
];

export function getPhaseForElapsed(elapsedMs: number): PhaseSchedule {
  for (const p of PHASE_SCHEDULES) {
    if (elapsedMs >= p.startMs && elapsedMs < p.endMs) {
      return p;
    }
  }
  return PHASE_SCHEDULES[PHASE_SCHEDULES.length - 1];
}

export function formatTimeRemaining(elapsedMs: number): { displayTime: string; remainingSec: number } {
  const remainingMs = Math.max(0, GAME_DURATION_MS - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);
  
  // Simulated campus clock starting at 11:58:30 and hitting 11:59:59 at 90s
  const baseSeconds = 30 + Math.floor(elapsedMs / 1000);
  const minute = baseSeconds < 60 ? '58' : '59';
  const second = (baseSeconds % 60).toString().padStart(2, '0');
  
  return {
    displayTime: `11:${minute}:${second}`,
    remainingSec,
  };
}
