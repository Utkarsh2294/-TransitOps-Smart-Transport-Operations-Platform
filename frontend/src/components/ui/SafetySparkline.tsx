export const SafetySparkline = ({ scores }: { scores: number[] }) => {
  if (scores.length < 2) return <span className="text-xs text-muted">No trend yet</span>;
  const points = scores.map((score, index) => `${(index / (scores.length - 1)) * 72},${28 - (score / 100) * 24}`).join(" ");
  return <svg aria-label="Safety score trend" className="h-8 w-[76px]" viewBox="0 0 72 28"><polyline fill="none" points={points} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
};
