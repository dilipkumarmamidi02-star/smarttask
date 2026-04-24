// SkillBadge.jsx
export default function SkillBadge({ skill, matched = false, size = "sm" }) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border transition-colors ${sizeClasses} ${
        matched
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-muted text-muted-foreground border-border"
      }`}
    >
      {skill}
    </span>
  );
}
