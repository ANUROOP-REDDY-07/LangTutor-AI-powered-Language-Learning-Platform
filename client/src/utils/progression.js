export const XP_LEVELS = [
  { level: 1, xp: 0, title: "Beginner" },
  { level: 2, xp: 150, title: "Learner" },
  { level: 3, xp: 350, title: "Speaker" },
  { level: 4, xp: 700, title: "Communicator" },
  { level: 5, xp: 1200, title: "Confident" },
  { level: 6, xp: 1800, title: "Fluent" },
  { level: 7, xp: 2500, title: "Advanced" },
  { level: 8, xp: 3500, title: "Expert" }
];

export function getLevelData(xp) {
  let currentLevel = XP_LEVELS[0];
  let nextLevel = XP_LEVELS[1];
  
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].xp) {
      currentLevel = XP_LEVELS[i];
      nextLevel = XP_LEVELS[i + 1] || null;
    } else {
      break;
    }
  }
  
  const xpIntoLevel = xp - currentLevel.xp;
  const xpNeededForNext = nextLevel ? nextLevel.xp - currentLevel.xp : 0;
  const progressPercent = nextLevel ? (xpIntoLevel / xpNeededForNext) * 100 : 100;
  const xpRemaining = nextLevel ? nextLevel.xp - xp : 0;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpIntoLevel,
    xpNeededForNext,
    progressPercent,
    nextLevelTitle: nextLevel ? nextLevel.title : null,
    xpRemaining
  };
}
