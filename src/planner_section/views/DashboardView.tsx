import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckSquare, Users, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocs, useTasks } from "../store/DataProvider";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Assignee, TaskPriority } from "../types";

const teamMembers = [
  { name: "Dominik" as Assignee, role: "Lead", initials: "D" },
  { name: "Jason" as Assignee, role: "Product", initials: "J" },
  { name: "Sub" as Assignee, role: "Dev", initials: "S" },
];

const priorityColors: Record<TaskPriority, string> = {
  Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  High: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function DashboardView() {
  const navigate = useNavigate();
  const { docs, isLoading: docsLoading, createDoc } = useDocs();
  const { tasks, isLoading: tasksLoading } = useTasks();

  const isLoading = docsLoading || tasksLoading;

  // Calculate stats
  const openTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status !== "Done").length;
  }, [tasks]);

  const tasksByAssignee = useMemo(() => {
    const counts: Record<Assignee, number> = { Dominik: 0, Jason: 0, Sub: 0 };
    tasks.forEach((t) => {
      if (t.status !== "Done" && counts[t.assignee] !== undefined) {
        counts[t.assignee]++;
      }
    });
    return counts;
  }, [tasks]);

  const recentDocs = useMemo(() => {
    return [...docs]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 5);
  }, [docs]);

  const highPriorityTasks = useMemo(() => {
    return tasks.filter(
      (t) => (t.priority === "High" || t.priority === "Critical") && t.status !== "Done"
    );
  }, [tasks]);

  const handleNewDoc = async () => {
    await createDoc({
      title: "Untitled Document",
      content: "<p>Start writing here...</p>",
      tags: [],
      createdBy: "Dominik",
    });
    navigate("/docs");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, Dominik</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Docs Card */}
        <Card className="bg-card border-border hover:border-gold/30 transition-colors group cursor-pointer" onClick={() => navigate("/docs")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Docs</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <FileText className="w-5 h-5 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{docs.length}</div>
            <p className="text-sm text-muted-foreground mt-1">pages created</p>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card className="bg-card border-border hover:border-silver/30 transition-colors group cursor-pointer" onClick={() => navigate("/tasks")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tasks</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-silver/10 flex items-center justify-center group-hover:bg-silver/20 transition-colors">
              <CheckSquare className="w-5 h-5 text-silver" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{openTasksCount}</div>
            <p className="text-sm text-muted-foreground mt-1">tasks remaining</p>
          </CardContent>
        </Card>

        {/* Tasks by Assignee Card */}
        <Card className="bg-card border-border hover:border-gold/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks by Assignee</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/10 to-silver/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-silver/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-gold">{member.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByAssignee[member.name]} tasks
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recently Updated Docs */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-lg font-medium">Recently Updated Docs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No documents yet</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-hover cursor-pointer transition-colors"
                  onClick={() => navigate("/docs")}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {doc.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(doc.lastUpdated), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* High Priority Tasks */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <CardTitle className="text-lg font-medium">High Priority Tasks</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {highPriorityTasks.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {highPriorityTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No high priority tasks</p>
          ) : (
            <div className="space-y-3">
              {highPriorityTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-hover cursor-pointer transition-colors"
                  onClick={() => navigate("/tasks")}
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0", priorityColors[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{task.assignee}</span>
                      </div>
                    </div>
                  </div>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {format(new Date(task.dueDate), "MMM d")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleNewDoc}
              className="px-4 py-2 bg-gold text-primary-foreground rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors gold-glow"
            >
              New Document
            </button>
            <button
              onClick={() => navigate("/tasks")}
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              View Tasks
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              Settings
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
