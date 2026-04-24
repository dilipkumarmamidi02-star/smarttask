import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskCard from "@/components/TaskCard";
import { calculateSkillMatch, SKILL_CATEGORIES } from "@/lib/skillsData";

const ITEMS_PER_PAGE = 10;

export default function Marketplace() {
  const { userProfile, isLoadingAuth } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      if (!userProfile && !window.location.pathname.includes("marketplace")) return;
      const allTasks = await entities.Task.filter({ status: "open" }, "-created_date");
      setUserSkills(userProfile?.skills || []);
      setTasks(allTasks);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  const filtered = tasks.filter((task) => {
    if (userSkills.length > 0) {
      const match = calculateSkillMatch(userSkills, task.required_skills);
      if (match === 0) return false;
    }
    if (category !== "all" && task.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        task.required_skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Task Marketplace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {userSkills.length > 0
            ? `Showing ${filtered.length} tasks matching your skills`
            : "Browse all available tasks"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter size={14} className="mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.keys(SKILL_CATEGORIES).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
            <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No tasks found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {paged.map((task) => (
            <TaskCard key={task.id} task={task} userSkills={userSkills} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
