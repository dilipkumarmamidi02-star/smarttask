import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/lib/firestore";
import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = [
  "hsl(250,80%,60%)", "hsl(172,66%,50%)", "hsl(38,92%,50%)",
  "hsl(340,75%,55%)", "hsl(200,70%,50%)", "#8884d8", "#ffc658", "#82ca9d",
];

export default function ClientAnalytics() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const myTasks = await entities.Task.filter({ posted_by: userProfile.email });
      const allApps = await entities.Application.list("-created_date", 500);
      const myTaskIds = new Set(myTasks.map((t) => t.id));
      const myApps = allApps.filter((a) => myTaskIds.has(a.task_id));

      const catBudget = {};
      const catComplete = {};
      myTasks.forEach((t) => {
        const cat = t.category || "Other";
        catBudget[cat] = (catBudget[cat] || 0) + (t.budget || 0);
        if (t.status === "completed") catComplete[cat] = (catComplete[cat] || 0) + 1;
      });

      setBudgetData(Object.entries(catBudget).map(([name, budget]) => ({ name, budget })));

      const catTotals = {};
      myTasks.forEach((t) => {
        const cat = t.category || "Other";
        catTotals[cat] = (catTotals[cat] || 0) + 1;
      });
      setCategoryData(
        Object.entries(catTotals).map(([name, value]) => ({
          name, value,
          completed: catComplete[name] || 0,
          rate: catTotals[name]
            ? Math.round(((catComplete[name] || 0) / catTotals[name]) * 100)
            : 0,
        }))
      );

      const totalBudget = myTasks.reduce((s, t) => s + (t.budget || 0), 0);
      const totalSpent = myTasks
        .filter((t) => t.status === "completed")
        .reduce((s, t) => s + (t.budget || 0), 0);
      const completionRate =
        myTasks.length > 0
          ? Math.round(
              (myTasks.filter((t) => t.status === "completed").length / myTasks.length) * 100
            )
          : 0;
      const avgApps = myTasks.length > 0 ? Math.round(myApps.length / myTasks.length) : 0;
      const budgetUtilization =
        totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      const completedTasks = myTasks.filter(
        (t) => t.status === "completed" && t.created_date && t.updated_date
      );
      const avgDays =
        completedTasks.length > 0
          ? Math.round(
              completedTasks.reduce(
                (s, t) =>
                  s + (new Date(t.updated_date) - new Date(t.created_date)) / 86400000,
                0
              ) / completedTasks.length
            )
          : 0;

      setSummaryStats({
        totalBudget, totalSpent, avgApps,
        totalTasks: myTasks.length, completionRate, budgetUtilization, avgDays,
      });
      setLoading(false);
    }
    load();
  }, [userProfile]);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Budget", value: `₹${summaryStats.totalBudget}` },
          { label: "Budget Utilized", value: `${summaryStats.budgetUtilization}%` },
          { label: "Completion Rate", value: `${summaryStats.completionRate}%` },
          { label: "Avg. Apps/Task", value: summaryStats.avgApps },
          { label: "Avg. Days to Complete", value: summaryStats.avgDays ? `${summaryStats.avgDays}d` : "N/A" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xl font-heading font-bold text-primary">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Budget by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="budget" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Task Distribution by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%" outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {categoryData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Success Rate by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Completed</th>
                <th className="text-right py-2 text-muted-foreground font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 font-medium text-foreground">{row.name}</td>
                  <td className="py-2 text-right text-muted-foreground">{row.value}</td>
                  <td className="py-2 text-right text-muted-foreground">{row.completed}</td>
                  <td className="py-2 text-right">
                    <span className={`font-semibold ${row.rate >= 50 ? "text-green-500" : "text-yellow-500"}`}>
                      {row.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
