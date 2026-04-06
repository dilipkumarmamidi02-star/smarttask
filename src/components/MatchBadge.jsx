import { getMatchColor } from "@/lib/skillsData";

export default function MatchBadge({ percent }) {
  const colorClass = getMatchColor(percent);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${colorClass}`}
    >
      {percent}% Match
    </span>
  );
}
