// CodeReels Points Engine — Full implementation of scoring formulas

export interface ReelStats {
  likes: number;
  shares: number;
  saves: number;
  comments: number;
  bestReply: boolean;
  avgWatchPercent: number;
  totalViews: number;
  videoQuality: 'high' | 'normal' | 'low';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  authenticityFactor: number; // 1.0 normal, 0.6 suspicious, 0.3 spam
}

export interface UserStats {
  xp: number;
  reputationScore: number;
  coins: number;
  level: number;
  streakCount: number;
}

const VQ_MAP = { high: 1.2, normal: 1.0, low: 0.7 };
const DM_MAP = { Easy: 1.0, Medium: 1.5, Hard: 2.5 };

export function calculateWatchTimeScore(avgWatchPercent: number, vq: 'high' | 'normal' | 'low'): number {
  const vqMultiplier = VQ_MAP[vq];
  return (avgWatchPercent / 100) * 20 * vqMultiplier;
}

export function calculateWatchPoints(watchPercent: number): number {
  if (watchPercent >= 100) return 10;
  if (watchPercent >= 75) return 6;
  if (watchPercent >= 50) return 3;
  if (watchPercent >= 25) return 1;
  return 0;
}

export function calculateEngagementRate(stats: ReelStats): number {
  const L = stats.likes;
  const S = stats.shares;
  const SV = stats.saves;
  const C = stats.comments;
  const BR = stats.bestReply ? 1 : 0;
  const WT = calculateWatchTimeScore(stats.avgWatchPercent, stats.videoQuality);
  return (L * 2) + (S * 4) + (SV * 3) + (C * 3) + (BR * 50) + WT;
}

export function calculateFES(stats: ReelStats): number {
  const ER = calculateEngagementRate(stats);
  const DM = DM_MAP[stats.difficulty];
  return ER * DM * stats.authenticityFactor;
}

export function calculateFPA(stats: ReelStats, userStats: UserStats): number {
  const FES = calculateFES(stats);
  const RM = 1 + (userStats.reputationScore / 10000);
  let fpa = FES * RM;
  // Diminishing returns after 20K XP
  if (userStats.xp > 20000) {
    fpa *= 0.9;
  }
  return Math.round(fpa * 100) / 100;
}

export function calculateCoins(fpa: number): number {
  return Math.floor(fpa / 10);
}

export function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 10)));
}

export function xpForLevel(level: number): number {
  return level * level * 10;
}

export function calculateStreakBonus(streakDay: number): number {
  return 10 * streakDay;
}

export function calculateHelperPoints(difficulty: 'Easy' | 'Medium' | 'Hard', reputationScore: number): number {
  const DM = DM_MAP[difficulty];
  const RM = 1 + (reputationScore / 10000);
  return Math.round(50 * DM * RM);
}

export function calculateKnowledgePoints(): number {
  return 40;
}

export function calculateVotePower(reputationScore: number): number {
  return 1 + (reputationScore / 5000);
}

export function calculateRSCORE(stats: ReelStats): number {
  if (stats.totalViews === 0) return 0;
  const ERATE = (stats.likes + stats.comments + stats.shares + stats.saves) / stats.totalViews;
  const RET = stats.avgWatchPercent / 100;
  const shareRatio = stats.shares / stats.totalViews;
  return (ERATE * 0.4) + (RET * 0.4) + (shareRatio * 0.2);
}

export function getReachTier(rscore: number): string {
  if (rscore > 0.75) return '20K users';
  if (rscore > 0.65) return '5K users';
  if (rscore > 0.50) return '1K users';
  return 'Limited';
}

export function applyAuthorityBoost(rscore: number, reputationScore: number): number {
  if (reputationScore > 20000) return rscore * 1.5;
  if (reputationScore > 5000) return rscore * 1.2;
  return rscore;
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'text-success';
    case 'Medium': return 'text-warning';
    case 'Hard': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

export function getDifficultyBg(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'bg-success/20 text-success border-success/30';
    case 'Medium': return 'bg-warning/20 text-warning border-warning/30';
    case 'Hard': return 'bg-destructive/20 text-destructive border-destructive/30';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'DSA': return 'bg-primary/20 text-primary border-primary/30';
    case 'Web Dev': return 'bg-secondary/20 text-secondary border-secondary/30';
    case 'AI-ML': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Hardware': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
}
