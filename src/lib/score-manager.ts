export const SCORE_RULES = {
  TASK_SUCCESS_UPLOAD: 10,      // +10% on normal task
  CRISIS_SUCCESS_UPLOAD: 20,    // +20% on team boss event
  MISTAKE_PENALTY_UPLOAD: 5,    // -5% on wrong control press
  TIMEOUT_PENALTY_UPLOAD: 5,    // -5% on task expiration
  HINT_PENALTY_UPLOAD: 3,       // -3% on hint reveal
  CRISIS_FAIL_PENALTY: 10,      // -10% on missed crisis
  COMBO_3_BOOST: 10,            // +10% bonus when hitting 3x combo
  COMBO_5_BOOST: 15,            // +15% bonus when hitting 5x mega combo
};

export function clampUpload(val: number): number {
  if (val < 0) return 0;
  if (val > 100) return 100;
  return Math.round(val);
}

export interface ScoreUpdateResult {
  newUpload: number;
  newCombo: number;
  newMaxCombo: number;
  isVictory: boolean;
  delta: number;
  message: string;
}

export function handleTaskSuccess(currentUpload: number, currentCombo: number, currentMaxCombo: number): ScoreUpdateResult {
  const nextCombo = currentCombo + 1;
  const maxCombo = Math.max(nextCombo, currentMaxCombo);
  let delta = SCORE_RULES.TASK_SUCCESS_UPLOAD;
  let message = `+${SCORE_RULES.TASK_SUCCESS_UPLOAD}% UPLOAD`;

  if (nextCombo === 3) {
    delta += SCORE_RULES.COMBO_3_BOOST;
    message = `🔥 PANIC COMBO x3! (+${SCORE_RULES.TASK_SUCCESS_UPLOAD + SCORE_RULES.COMBO_3_BOOST}%)`;
  } else if (nextCombo === 5) {
    delta += SCORE_RULES.COMBO_5_BOOST;
    message = `⚡ MEGA COMBO x5! (+${SCORE_RULES.TASK_SUCCESS_UPLOAD + SCORE_RULES.COMBO_5_BOOST}%)`;
  }

  const newUpload = clampUpload(currentUpload + delta);
  return {
    newUpload,
    newCombo: nextCombo,
    newMaxCombo: maxCombo,
    isVictory: newUpload >= 100,
    delta,
    message
  };
}

export function handleMistake(currentUpload: number, currentMaxCombo: number): ScoreUpdateResult {
  const delta = -SCORE_RULES.MISTAKE_PENALTY_UPLOAD;
  const newUpload = clampUpload(currentUpload + delta);
  return {
    newUpload,
    newCombo: 0,
    newMaxCombo: currentMaxCombo,
    isVictory: false,
    delta,
    message: `❌ WRONG ACTION! -${SCORE_RULES.MISTAKE_PENALTY_UPLOAD}% (Combo Broken)`
  };
}

export function handleTaskTimeout(currentUpload: number, currentMaxCombo: number): ScoreUpdateResult {
  const delta = -SCORE_RULES.TIMEOUT_PENALTY_UPLOAD;
  const newUpload = clampUpload(currentUpload + delta);
  return {
    newUpload,
    newCombo: 0,
    newMaxCombo: currentMaxCombo,
    isVictory: false,
    delta,
    message: `⏳ TASK EXPIRED! -${SCORE_RULES.TIMEOUT_PENALTY_UPLOAD}% (Combo Broken)`
  };
}

export function handleCrisisSuccess(currentUpload: number, currentCombo: number, currentMaxCombo: number): ScoreUpdateResult {
  const delta = SCORE_RULES.CRISIS_SUCCESS_UPLOAD;
  const newUpload = clampUpload(currentUpload + delta);
  const nextCombo = currentCombo + 1;
  return {
    newUpload,
    newCombo: nextCombo,
    newMaxCombo: Math.max(nextCombo, currentMaxCombo),
    isVictory: newUpload >= 100,
    delta,
    message: `🚨 CRISIS RESOLVED! +${delta}% UPLOAD`
  };
}

export function handleCrisisFail(currentUpload: number, currentMaxCombo: number): ScoreUpdateResult {
  const delta = -SCORE_RULES.CRISIS_FAIL_PENALTY;
  const newUpload = clampUpload(currentUpload + delta);
  return {
    newUpload,
    newCombo: 0,
    newMaxCombo: currentMaxCombo,
    isVictory: false,
    delta,
    message: `💀 CRISIS FAILED! -${SCORE_RULES.CRISIS_FAIL_PENALTY}% UPLOAD`
  };
}

export const MEMBERSHIP_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScdpwK6YjFtwWux8XXBr7tJRYrIlJSdsTNbfT3mahZShdCxHQ/viewform';

export interface EndgameSummary {
  grade: 'S+' | 'A' | 'B' | 'C' | 'F-';
  title: string;
  subtext: string;
  learnitCta: string;
  learnitQuote: string;
}

export function getEndgameSummary(isVictory: boolean, uploadPercent: number, maxCombo: number, elapsedSeconds: number): EndgameSummary {
  if (isVictory) {
    if (elapsedSeconds <= 55 && maxCombo >= 4) {
      return {
        grade: 'S+',
        title: 'CERTIFIED 11:59 LEGENDS',
        subtext: `Uploaded with ${Math.round(90 - elapsedSeconds)}s to spare! Absolute neural synchronization.`,
        learnitCta: 'JOIN LEARNIT CLUB →',
        learnitQuote: 'Join our club for more such fun experiences and cool peeps!'
      };
    } else if (maxCombo >= 2) {
      return {
        grade: 'A',
        title: 'ELITE PROCRASTINATION SQUAD',
        subtext: `100% Upload achieved under extreme campus stress.`,
        learnitCta: 'JOIN LEARNIT CLUB →',
        learnitQuote: 'Join our club for more such fun experiences and cool peeps!'
      };
    } else {
      return {
        grade: 'B',
        title: 'BARELY ESCAPED EXPULSION',
        subtext: `Clock was at 11:59:58, but a win is a win.`,
        learnitCta: 'JOIN LEARNIT CLUB →',
        learnitQuote: 'Join our club for more such fun experiences and cool peeps!'
      };
    }
  } else {
    return {
      grade: 'F-',
      title: 'SUMMARILY EXPELLED 💀',
      subtext: `Portal closed at 11:59:59 with only ${uploadPercent}% uploaded. Professor will not accept excuses.`,
      learnitCta: 'JOIN LEARNIT TO LEVEL UP →',
      learnitQuote: 'Join our club for more such fun experiences and cool peeps!'
    };
  }
}
