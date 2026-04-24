import { Link } from "react-router-dom";
import { Calendar, IndianRupee, Building2, Clock } from "lucide-react";
import SkillBadge from "./SkillBadge";
import MatchBadge from "./MatchBadge";
import { calculateSkillMatch } from "@/lib/skillsData";
import moment from "moment";

const statusColors = {
  open: "bg-green-500/10 text-green-400 border-green-500/30",
  assigned: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  completed: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function TaskCard({ task, userSkills = [] }) {
  const matchPercent = calculateSkillMatch(userSkills, task.required_skills);
  const deadlineDate = moment(task.deadline);
  const isOverdue = deadlineDate.isBefore(moment());

  return (
    <Link to={`/task/${task.id}`} className="block group">
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">
              {task.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Building2 size={12} />
              <span>{task.company_name}</span>
            </div>
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
              statusColors[task.status] || statusColors.open
            }`}
          >
            {task.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.required_skills?.slice(0, 4).map((skill) => (
            <SkillBadge key={skill} skill={skill} matched={userSkills.includes(skill)} />
          ))}
          {task.required_skills?.length > 4 && (
            <span className="text-xs text-muted-foreground self-center">
              +{task.required_skills.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <IndianRupee size={12} />
              <span className="font-semibold text-card-foreground">₹{task.budget}</span>
            </span>
            <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
              {isOverdue ? <Clock size={12} /> : <Calendar size={12} />}
              {deadlineDate.format("MMM D, YYYY")}
            </span>
          </div>
          {userSkills.length > 0 && <MatchBadge percent={matchPercent} />}
        </div>
      </div>
    </Link>
  );
}
