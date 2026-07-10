export function bumpLikeCount(
  count: number,
  wasLiked: boolean,
  nowLiked: boolean,
): number {
  if (wasLiked === nowLiked) return count;
  return Math.max(0, count + (nowLiked ? 1 : -1));
}
