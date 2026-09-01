// Zero-Knowledge Visual Matching Puzzle Engine
import { ControlWidget, ActiveTask, CrisisEvent } from './types';

const COLORS = ['yellow', 'blue', 'red', 'green', 'purple'] as const;
type ColorType = typeof COLORS[number];

const COLOR_NAMES: Record<ColorType, string> = {
  yellow: 'YELLOW 🟡',
  blue: 'BLUE 🔵',
  red: 'RED 🔴',
  green: 'GREEN 🟢',
  purple: 'PURPLE 🟣',
};

const SHAPES = ['triangle', 'square', 'circle', 'star', 'bolt'] as const;
type ShapeType = typeof SHAPES[number];

const SHAPE_NAMES: Record<ShapeType, string> = {
  triangle: 'TRIANGLE ▲',
  square: 'SQUARE ■',
  circle: 'CIRCLE ●',
  star: 'STAR ★',
  bolt: 'LIGHTNING ⚡',
};

function pickRandom<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomDistinct<T>(arr: readonly T[] | T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

let puzzleCounter = 1;

export interface GeneratedPuzzleSet {
  widgets: ControlWidget[];
  task: ActiveTask;
}

/**
 * Generates a completely zero-knowledge, 100% deterministic visual puzzle.
 * - Directives (Blue) gets the exact verbal shout instruction.
 * - Blueprints (Purple) gets the decoding/safe path rule.
 * - Controls (Yellow) gets the tactile widgets on phone.
 */
export function generateVisualPuzzle(difficulty: 'easy' | 'medium' | 'hard'): GeneratedPuzzleSet {
  const puzzleTypeIndex = Math.floor(Math.random() * 5);
  const idSuffix = `${Date.now()}_${puzzleCounter++}`;

  switch (puzzleTypeIndex) {
    case 0: {
      // 1. Color Bypass Switch
      const [safeColor, trapColor, dummyColor] = pickRandomDistinct(COLORS, 3);
      const widgetId = `toggle_rack_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: `${widgetId}_${safeColor}`,
          type: 'TOGGLE' as const,
          label: `${COLOR_NAMES[safeColor]} SWITCH`,
          color: safeColor,
          currentValue: false,
          targetValue: true,
        },
        {
          id: `${widgetId}_${trapColor}`,
          type: 'TOGGLE' as const,
          label: `${COLOR_NAMES[trapColor]} SWITCH`,
          color: trapColor,
          currentValue: false,
          targetValue: false,
        },
        {
          id: `${widgetId}_${dummyColor}`,
          type: 'TOGGLE' as const,
          label: `${COLOR_NAMES[dummyColor]} SWITCH`,
          color: dummyColor,
          currentValue: false,
          targetValue: false,
        },
      ].sort(() => 0.5 - Math.random());

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'CIRCUIT BYPASS',
        description: 'Flip the safe power bypass switch.',
        targetWidgetId: `${widgetId}_${safeColor}`,
        expectedValue: true,
        directive: {
          shoutText: `📢 SHOUT: "FLIP THE ${COLOR_NAMES[safeColor]} SWITCH!"`,
          targetRole: 'CONTROLS',
          urgency: difficulty === 'hard' ? 'critical' : 'normal',
        },
        blueprint: {
          title: 'POWER RELAY BLUEPRINT',
          dangerClue: `⚠️ DANGER: ${COLOR_NAMES[trapColor]} is a high-voltage trap!`,
          safePathClue: `✅ SAFE PATH: The clean bypass is ${COLOR_NAMES[safeColor]}.`,
          visualDiagram: {
            safeColor: safeColor,
            trapColor: trapColor,
          },
        },
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 14000 : difficulty === 'medium' ? 10000 : 7000,
        completed: false,
      };

      return { widgets, task };
    }

    case 1: {
      // 2. Rotary Dial Tuning (e.g. dial to 73)
      const targetDial = Math.floor(Math.random() * 8 + 1) * 10 + Math.floor(Math.random() * 9 + 1); // e.g. 73
      const fakeDial = (targetDial + 30) % 90 + 10;
      const widgetId = `dial_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: widgetId,
          type: 'ROTARY_DIAL',
          label: 'FREQUENCY CALIBRATOR',
          color: 'amber',
          currentValue: 0,
          targetValue: targetDial,
          min: 0,
          max: 100,
        },
      ];

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'FREQUENCY CALIBRATION',
        description: 'Tune the dial to the precise safe level.',
        targetWidgetId: widgetId,
        expectedValue: targetDial,
        directive: {
          shoutText: `📢 SHOUT: "TURN DIAL TO ${targetDial}!"`,
          targetRole: 'CONTROLS',
          urgency: 'normal',
        },
        blueprint: {
          title: 'OSCILLATOR BLUEPRINT',
          safePathClue: `🎯 TARGET HARMONIC: ${targetDial}`,
          dangerClue: `⚠️ DO NOT SET TO ${fakeDial} (Overload risk)`,
          visualDiagram: {
            safeColor: 'amber',
            trapColor: 'red',
            targetValue: targetDial,
          },
        },
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 14000 : 10000,
        completed: false,
      };

      return { widgets, task };
    }

    case 2: {
      // 3. Shape Push Button Matrix
      const [safeShape, trapShape, dummyShape] = pickRandomDistinct(SHAPES, 3);
      const safeColor: ColorType = pickRandom(COLORS);
      const widgetId = `button_matrix_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: `${widgetId}_safe`,
          type: 'PUSH_BUTTON' as const,
          label: SHAPE_NAMES[safeShape],
          color: safeColor,
          shape: safeShape,
          currentValue: false,
          targetValue: true,
        },
        {
          id: `${widgetId}_trap`,
          type: 'PUSH_BUTTON' as const,
          label: SHAPE_NAMES[trapShape],
          color: 'red' as const,
          shape: trapShape,
          currentValue: false,
          targetValue: false,
        },
        {
          id: `${widgetId}_dummy`,
          type: 'PUSH_BUTTON' as const,
          label: SHAPE_NAMES[dummyShape],
          color: 'purple' as const,
          shape: dummyShape,
          currentValue: false,
          targetValue: false,
        },
      ].sort(() => 0.5 - Math.random());

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'GLYPH OVERRIDE',
        description: 'Press the authenticated security symbol.',
        targetWidgetId: `${widgetId}_safe`,
        expectedValue: true,
        directive: {
          shoutText: `📢 SHOUT: "PRESS THE ${SHAPE_NAMES[safeShape]} BUTTON!"`,
          targetRole: 'CONTROLS',
          urgency: 'urgent',
        },
        blueprint: {
          title: 'SYMBOL SCHEMATIC',
          safePathClue: `✅ VALID GLYPH: ${SHAPE_NAMES[safeShape]} (${COLOR_NAMES[safeColor]})`,
          dangerClue: `⚠️ FORBIDDEN GLYPH: ${SHAPE_NAMES[trapShape]}`,
          visualDiagram: {
            safeColor: safeColor,
            trapColor: 'red',
            targetValue: safeShape,
          },
        },
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 12000 : 8000,
        completed: false,
      };

      return { widgets, task };
    }

    case 3: {
      // 4. Pressure Hold Lever (2-second hold)
      const color = pickRandom(['red', 'yellow', 'green'] as const);
      const widgetId = `lever_${idSuffix}`;
      const holdSec = 2;

      const widgets: ControlWidget[] = [
        {
          id: widgetId,
          type: 'HOLD_LEVER',
          label: `HOLD ${COLOR_NAMES[color]} LEVER`,
          color: color,
          currentValue: 0,
          targetValue: holdSec,
          requiredHoldSeconds: holdSec,
        },
      ];

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'PRESSURE PURGE',
        description: `Hold the lever down for ${holdSec} seconds.`,
        targetWidgetId: widgetId,
        expectedValue: holdSec,
        directive: {
          shoutText: `📢 SHOUT: "HOLD THE ${COLOR_NAMES[color]} LEVER FOR ${holdSec} SECONDS!"`,
          targetRole: 'CONTROLS',
          urgency: 'urgent',
        },
        blueprint: {
          title: 'HYDRAULIC VALVE BLUEPRINT',
          safePathClue: `⏳ PURGE DURATION: Exactly ${holdSec} seconds on ${COLOR_NAMES[color]} lever.`,
          dangerClue: '⚠️ Releasing early will vent steam and abort upload!',
          visualDiagram: {
            safeColor: color,
            trapColor: 'red',
            targetValue: `${holdSec}s`,
          },
        },
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 15000 : 10000,
        completed: false,
      };

      return { widgets, task };
    }

    default: {
      // 5. Multi-Step Slider (e.g. Slide to 75%)
      const targetPercent = pickRandom([25, 50, 75, 100]);
      const widgetId = `slider_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: widgetId,
          type: 'SLIDER',
          label: 'CAPACITOR DISCHARGE',
          color: 'blue',
          currentValue: 0,
          targetValue: targetPercent,
          options: ['0%', '25%', '50%', '75%', '100%'],
        },
      ];

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'CAPACITOR CHARGE',
        description: `Set the slider to ${targetPercent}%.`,
        targetWidgetId: widgetId,
        expectedValue: targetPercent,
        directive: {
          shoutText: `📢 SHOUT: "SLIDE CAPACITOR TO ${targetPercent}%!"`,
          targetRole: 'CONTROLS',
          urgency: 'normal',
        },
        blueprint: {
          title: 'ENERGY MATRIX BLUEPRINT',
          safePathClue: `⚡ OPTIMAL CHARGE: ${targetPercent}%`,
          dangerClue: '⚠️ Any other setting causes brownout.',
          visualDiagram: {
            safeColor: 'blue',
            trapColor: 'red',
            targetValue: `${targetPercent}%`,
          },
        },
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 14000 : 9000,
        completed: false,
      };

      return { widgets, task };
    }
  }
}

/**
 * Creates the Synchronized Co-op Boss Event for Phase 3 (35–55s)
 */
export function generateCrisisEvent(playerCount: number): CrisisEvent {
  return {
    id: `crisis_${Date.now()}`,
    title: '🚨 CAMPUS WI-FI FAILURE 🚨',
    instruction: `ALL ${playerCount} PLAYERS MUST HOLD THE EMERGENCY SYNC BUTTON SIMULTANEOUSLY FOR 3 SECONDS!`,
    type: 'SYNC_HOLD',
    requiredHoldMs: 3000,
    activePlayersNeeded: playerCount,
    playersHolding: [],
    startedAt: Date.now(),
    durationMs: 16000,
    resolved: false,
  };
}
