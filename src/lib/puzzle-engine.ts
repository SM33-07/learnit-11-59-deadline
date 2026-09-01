// Purely Visual & Arbitrary Asymmetric Puzzle Engine
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
 * Generates an asymmetric visual task with deterministic zero-leakage rules.
 */
export function generateVisualPuzzle(difficulty: 'easy' | 'medium' | 'hard', taskIndex: number = 0): GeneratedPuzzleSet {
  const puzzleTypeIndex = Math.floor(Math.random() * 5);
  const idSuffix = `${Date.now()}_${puzzleCounter++}`;
  const assignedChannel: 'BLUEPRINTS' | 'DIRECTIVES' = taskIndex % 2 === 0 ? 'BLUEPRINTS' : 'DIRECTIVES';

  switch (puzzleTypeIndex) {
    case 0: {
      // 1. Color Switch
      const [safeColor, trapColor, dummyColor] = pickRandomDistinct(COLORS, 3);
      const widgetId = `toggle_${idSuffix}`;

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
        title: 'WIRE SNIP',
        description: 'Flip the safe bypass switch.',
        targetWidgetId: `${widgetId}_${safeColor}`,
        expectedValue: true,
        assignedChannel,
        widgets,
        status: 'ACTIVE',
        directive: {
          shoutText: `📢 SHOUT: "FLIP THE ${COLOR_NAMES[safeColor]} SWITCH!"`,
          targetRole: 'CONTROLS',
          urgency: difficulty === 'hard' ? 'critical' : 'normal',
        },
        blueprint: {
          title: 'WIRE BYPASS SCHEMATIC',
          dangerClue: `⚠️ TRAP: ${COLOR_NAMES[trapColor]} is electrified!`,
          safePathClue: `✅ SAFE: The clean wire is ${COLOR_NAMES[safeColor]}.`,
          visualDiagram: {
            safeColor,
            trapColor,
          },
        },
        hint: `Flip the ${COLOR_NAMES[safeColor]} switch on Controls. Avoid ${COLOR_NAMES[trapColor]}.`,
        hintRevealed: false,
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 18000 : difficulty === 'medium' ? 14000 : 10000,
        completed: false,
      };

      return { widgets, task };
    }

    case 1: {
      // 2. Rotary Dial Tuning (Target +/- 2 tolerance)
      const targetDial = Math.floor(Math.random() * 8 + 1) * 10 + Math.floor(Math.random() * 9 + 1); // e.g. 73
      const fakeDial = (targetDial + 30) % 90 + 10;
      const widgetId = `dial_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: widgetId,
          type: 'ROTARY_DIAL',
          label: 'PANIC DIAL',
          color: 'amber',
          currentValue: 50,
          targetValue: targetDial,
          min: 0,
          max: 100,
        },
      ];

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'DIAL PANIC',
        description: 'Tune dial to the target value.',
        targetWidgetId: widgetId,
        expectedValue: targetDial,
        assignedChannel,
        widgets,
        status: 'ACTIVE',
        directive: {
          shoutText: `📢 SHOUT: "TURN DIAL TO ${targetDial}!"`,
          targetRole: 'CONTROLS',
          urgency: 'normal',
        },
        blueprint: {
          title: 'DIAL SCHEMATIC',
          safePathClue: `🎯 BLUEPRINT TARGET: ${targetDial}`,
          dangerClue: `⚠️ DO NOT SET TO ${fakeDial}!`,
          visualDiagram: {
            safeColor: 'amber',
            trapColor: 'red',
            targetValue: targetDial,
          },
        },
        hint: `Turn the rotary dial on Controls precisely to ${targetDial}.`,
        hintRevealed: false,
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 18000 : 14000,
        completed: false,
      };

      return { widgets, task };
    }

    case 2: {
      // 3. Shape Glyph Push Button
      const [safeShape, trapShape, dummyShape] = pickRandomDistinct(SHAPES, 3);
      const safeColor: ColorType = pickRandom(COLORS);
      const widgetId = `button_${idSuffix}`;

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
        title: 'SYMBOL MATCH',
        description: 'Press the verified glyph.',
        targetWidgetId: `${widgetId}_safe`,
        expectedValue: true,
        assignedChannel,
        widgets,
        status: 'ACTIVE',
        directive: {
          shoutText: `📢 SHOUT: "PRESS THE ${SHAPE_NAMES[safeShape]} BUTTON!"`,
          targetRole: 'CONTROLS',
          urgency: 'urgent',
        },
        blueprint: {
          title: 'SYMBOL CIPHER',
          safePathClue: `⭐ SAFE GLYPH: ${SHAPE_NAMES[safeShape]} is clean.`,
          dangerClue: `☠️ TRAP: ${SHAPE_NAMES[trapShape]} will trigger reset!`,
          visualDiagram: {
            safeColor,
            trapColor: 'red',
            targetValue: SHAPE_NAMES[safeShape],
          },
        },
        hint: `Press the ${SHAPE_NAMES[safeShape]} button on Controls.`,
        hintRevealed: false,
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 18000 : 12000,
        completed: false,
      };

      return { widgets, task };
    }

    case 3: {
      // 4. Stepped Slider
      const safeLevel = Math.floor(Math.random() * 4) + 1; // 1 to 4
      const widgetId = `slider_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: widgetId,
          type: 'SLIDER',
          label: 'POWER LEVEL SLIDER',
          color: 'green',
          currentValue: 1,
          targetValue: safeLevel,
          min: 1,
          max: 4,
        },
      ];

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'POWER BOOST',
        description: 'Slide to the verified power tier.',
        targetWidgetId: widgetId,
        expectedValue: safeLevel,
        assignedChannel,
        widgets,
        status: 'ACTIVE',
        directive: {
          shoutText: `📢 SHOUT: "SLIDE POWER TO LEVEL ${safeLevel}!"`,
          targetRole: 'CONTROLS',
          urgency: 'normal',
        },
        blueprint: {
          title: 'POWER GRID SCHEMATIC',
          safePathClue: `🔋 REQUIRED LEVEL: [${safeLevel}]`,
          dangerClue: `⚠️ Any other level causes failure!`,
          visualDiagram: {
            safeColor: 'green',
            trapColor: 'red',
            targetValue: `LEVEL ${safeLevel}`,
          },
        },
        hint: `Move the power slider on Controls to Level ${safeLevel}.`,
        hintRevealed: false,
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 18000 : 12000,
        completed: false,
      };

      return { widgets, task };
    }

    default: {
      // 5. Pressure Lever
      const [safeColor] = pickRandomDistinct(COLORS, 1);
      const targetPercent = 80;
      const widgetId = `lever_${idSuffix}`;

      const widgets: ControlWidget[] = [
        {
          id: widgetId,
          type: 'HOLD_LEVER',
          label: `${COLOR_NAMES[safeColor]} LEVER`,
          color: safeColor,
          currentValue: 0,
          targetValue: targetPercent,
          min: 0,
          max: 100,
          requiredHoldSeconds: 2,
        },
      ];

      const task: ActiveTask = {
        id: `task_${idSuffix}`,
        title: 'PRESSURE OVERRIDE',
        description: 'Hold lever to charge system.',
        targetWidgetId: widgetId,
        expectedValue: targetPercent,
        assignedChannel,
        widgets,
        status: 'ACTIVE',
        directive: {
          shoutText: `📢 SHOUT: "HOLD ${COLOR_NAMES[safeColor]} LEVER FOR 2 SECONDS!"`,
          targetRole: 'CONTROLS',
          urgency: 'critical',
        },
        blueprint: {
          title: 'PRESSURE SCHEMATIC',
          safePathClue: `⚡ CHARGE REQUIRED: ${targetPercent}%`,
          dangerClue: '⚠️ Do not release early!',
          visualDiagram: {
            safeColor: 'blue',
            trapColor: 'red',
            targetValue: `${targetPercent}%`,
          },
        },
        hint: `Hold down the ${COLOR_NAMES[safeColor]} lever on Controls for 2 full seconds.`,
        hintRevealed: false,
        createdAt: Date.now(),
        durationMs: difficulty === 'easy' ? 18000 : 12000,
        completed: false,
      };

      return { widgets, task };
    }
  }
}

/**
 * Creates the Synchronized Co-op Crisis Event for Phase 3 (45–65s)
 */
export function generateCrisisEvent(playerIds: string[]): CrisisEvent {
  const count = Math.min(3, Math.max(2, playerIds.length));
  return {
    id: `crisis_${Date.now()}`,
    title: '🚨 CAMPUS WI-FI MELTDOWN 🚨',
    instruction: `ALL ${count} SQUAD MEMBERS MUST HOLD THE EMERGENCY SYNC BUTTON SIMULTANEOUSLY FOR 3 SECONDS!`,
    type: 'SYNC_HOLD',
    requiredHoldMs: 3000,
    activePlayersNeeded: count,
    requiredPlayerIds: playerIds,
    playersHolding: [],
    holdStartedAt: null,
    startedAt: Date.now(),
    durationMs: 20000,
    resolved: false,
  };
}
