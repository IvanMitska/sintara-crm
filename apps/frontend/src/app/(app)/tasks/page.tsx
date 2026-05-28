"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  LayoutList,
  Kanban,
  Calendar as CalendarIcon,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  ListTodo,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import { tasksApi, contactsApi, dealsApi } from "@/lib/api";
import {
  Task,
  TaskFilters as TaskFiltersType,
  TaskStats as TaskStatsType,
  ViewMode,
  TaskStatus,
} from "@/components/tasks/types";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskListView } from "@/components/tasks/TaskListView";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";

export default function TasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [deals, setDeals] = useState<Array<{ id: string; title: string }>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filters, setFilters] = useState<TaskFiltersType>({
    status: "ALL",
    priority: "ALL",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<"status" | "priority" | "dueDate" | "assignee" | "none">("dueDate");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("PENDING");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tasks and related data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, contactsRes, dealsRes] = await Promise.all([
          tasksApi.getAll(),
          contactsApi.getAll(),
          dealsApi.getAll(),
        ]);

        const tasksData = tasksRes.data?.items || tasksRes.data?.data || tasksRes.data || [];
        const tasksArray = (Array.isArray(tasksData) ? tasksData : []).map((item: any) => ({
          ...item,
          assignee: item.assignee
            ? {
                ...item.assignee,
                name:
                  item.assignee.name ||
                  `${item.assignee.firstName || ""} ${item.assignee.lastName || ""}`.trim() ||
                  item.assignee.email ||
                  "—",
              }
            : undefined,
        })) as Task[];
        setTasks(tasksArray);

        const contactsData = contactsRes.data?.items || contactsRes.data?.data || contactsRes.data || [];
        const contactsArray = Array.isArray(contactsData) ? contactsData : [];
        setContacts(contactsArray.map((c: any) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`
        })));

        const dealsData = dealsRes.data?.items || dealsRes.data?.data || dealsRes.data || [];
        const dealsArray = Array.isArray(dealsData) ? dealsData : [];
        setDeals(dealsArray.map((d: any) => ({ id: d.id, title: d.title })));

        // Extract unique assignees from tasks
        const uniqueAssignees = new Map();
        tasksArray.forEach((task) => {
          if (task.assignee) {
            uniqueAssignees.set(task.assignee.id, task.assignee);
          }
        });
        setAssignees(Array.from(uniqueAssignees.values()));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(searchLower) &&
          !task.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.status && filters.status !== "ALL" && task.status !== filters.status) {
        return false;
      }

      if (filters.priority && filters.priority !== "ALL" && task.priority !== filters.priority) {
        return false;
      }

      if (filters.assigneeId) {
        if (filters.assigneeId === "current") {
          if (task.assignee?.id !== "1") return false;
        } else if (filters.assigneeId === "unassigned") {
          if (task.assignee) return false;
        } else if (task.assignee?.id !== filters.assigneeId) {
          return false;
        }
      }

      if (filters.overdue) {
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "COMPLETED";
        if (!isOverdue) return false;
      }

      return true;
    });
  }, [tasks, filters, searchQuery]);

  const stats: TaskStatsType = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      overdue: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status !== "COMPLETED"
      ).length,
      dueToday: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate).toDateString() === today.toDateString() &&
          t.status !== "COMPLETED"
      ).length,
      dueThisWeek: tasks.filter((t) => {
        if (!t.dueDate || t.status === "COMPLETED") return false;
        const due = new Date(t.dueDate);
        return due >= today && due <= weekEnd;
      }).length,
    };
  }, [tasks]);

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const handleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await tasksApi.update(id, {
        status: newStatus,
        completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: newStatus,
                completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : undefined,
              }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await tasksApi.update(id, {
        status,
        completedAt: status === "COMPLETED" ? new Date().toISOString() : null,
      });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
                ...task,
                status,
                completedAt: status === "COMPLETED" ? new Date().toISOString() : undefined,
              }
            : task
        )
      );
    } catch (error) {
      console.error("Failed to change status:", error);
    }
  };

  const handleTaskDelete = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setDetailSheetOpen(false);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailSheetOpen(true);
  };

  const handleTaskEdit = (task: Task) => {
    setEditTask(task);
    setCreateDialogOpen(true);
    setDetailSheetOpen(false);
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      if (editTask) {
        const response = await tasksApi.update(editTask.id, taskData);
        const updatedTask = response.data;
        setTasks((prev) =>
          prev.map((task) =>
            task.id === editTask.id
              ? { ...task, ...updatedTask, updatedAt: new Date().toISOString() }
              : task
          )
        );
        setEditTask(null);
      } else {
        const response = await tasksApi.create({
          ...taskData,
          status: taskData.status || initialStatus,
          priority: taskData.priority || "MEDIUM",
        });
        const newTask = response.data;
        setTasks((prev) => [newTask, ...prev]);
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleCreateTaskForStatus = (status: TaskStatus) => {
    setInitialStatus(status);
    setEditTask(null);
    setCreateDialogOpen(true);
  };

  return (
    <div className="h-full min-h-full flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 glass-card border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t("tasks.title")}</h1>

            {/* Stats Pills */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <ListTodo className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{t("tasks.statTotal")}</span>
                <span className="text-sm font-bold text-white">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 rounded-lg">
                <PlayCircle className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-violet-300">{t("tasks.statusInProgress")}</span>
                <span className="text-sm font-bold text-violet-300">{stats.inProgress}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-300">{t("tasks.statDone")}</span>
                <span className="text-sm font-bold text-green-300">{stats.completed}</span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-300">{t("tasks.overdueShort")}</span>
                  <span className="text-sm font-bold text-red-300">{stats.overdue}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-300">{t("tasks.today")}</span>
                <span className="text-sm font-bold text-amber-300">{stats.dueToday}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-300">{completionRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 lg:w-64 pl-10 pr-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-400 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:bg-white/10"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2.5 rounded-xl",
                showFilters ? "bg-violet-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* Export - hidden on mobile */}
            <button className="hidden sm:block p-2.5 hover:bg-white/5 rounded-xl">
              <Download className="w-5 h-5 text-gray-400" />
            </button>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditTask(null);
                setInitialStatus("PENDING");
                setCreateDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-600 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t("tasks.newTask")}</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={filters.status || "ALL"}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="ALL">{t("tasks.allStatuses")}</option>
                <option value="PENDING">{t("tasks.statusPending")}</option>
                <option value="IN_PROGRESS">{t("tasks.statusInProgress")}</option>
                <option value="COMPLETED">{t("tasks.statusCompleted")}</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority || "ALL"}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="ALL">{t("tasks.allPriorities")}</option>
                <option value="URGENT">{t("tasks.priorityUrgent")}</option>
                <option value="HIGH">{t("tasks.priorityHigh")}</option>
                <option value="MEDIUM">{t("tasks.priorityMedium")}</option>
                <option value="LOW">{t("tasks.priorityLow")}</option>
              </select>

              {/* Assignee Filter */}
              <select
                value={filters.assigneeId || ""}
                onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value || undefined })}
                className="px-4 py-2 bg-white/5 text-white rounded-xl text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="">{t("tasks.allAssignees")}</option>
                <option value="current">{t("tasks.myTasks")}</option>
                <option value="unassigned">{t("tasks.unassigned")}</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              {/* Overdue Toggle */}
              <button
                onClick={() => setFilters({ ...filters, overdue: !filters.overdue })}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  filters.overdue
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                {t("tasks.overdue")}
              </button>

              {/* Clear Filters */}
              {(filters.status !== "ALL" || filters.priority !== "ALL" || filters.assigneeId || filters.overdue) && (
                <button
                  onClick={() => setFilters({ status: "ALL", priority: "ALL" })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                  {t("common.reset")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="px-4 sm:px-6 py-3 glass-card border-b border-white/10 overflow-x-auto">
        <div className="flex items-center justify-between gap-4 min-w-fit">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                viewMode === "list"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tasks.listView")}</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                viewMode === "kanban"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tasks.kanbanView")}</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                viewMode === "calendar"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tasks.calendarView")}</span>
            </button>
          </div>

          {viewMode === "list" && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-400">{t("tasks.groupBy")}</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-3 py-1.5 bg-white/5 text-white rounded-lg text-sm border border-white/10 focus:ring-2 focus:ring-violet-500"
              >
                <option value="dueDate">{t("tasks.groupByDate")}</option>
                <option value="status">{t("tasks.groupByStatus")}</option>
                <option value="priority">{t("tasks.groupByPriority")}</option>
                <option value="assignee">{t("tasks.groupByAssignee")}</option>
                <option value="none">{t("tasks.groupByNone")}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {viewMode === "list" && (
          <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-6">
            <TaskListView
              tasks={filteredTasks}
              groupBy={groupBy}
              onTaskClick={handleTaskClick}
              onTaskComplete={handleTaskComplete}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}

        {viewMode === "kanban" && (
          <TaskKanban
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            onStatusChange={handleStatusChange}
            onCreateTask={handleCreateTaskForStatus}
          />
        )}

        {viewMode === "calendar" && (
          <div className="glass-card rounded-2xl border border-white/10 p-12">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <CalendarIcon className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-white">{t("tasks.calendarTitle")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("common.comingSoon")}</p>
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && viewMode !== "calendar" && (
          <div className="glass-card rounded-2xl border border-white/10 p-12">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <ListTodo className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-white">{t("tasks.notFound")}</p>
              <p className="text-sm text-gray-400 mt-1">{t("tasks.notFoundHint")}</p>
              <button
                onClick={() => {
                  setEditTask(null);
                  setInitialStatus("PENDING");
                  setCreateDialogOpen(true);
                }}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4" />
                {t("tasks.createTask")}
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditTask(null);
        }}
        onSubmit={handleCreateTask}
        initialStatus={initialStatus}
        assignees={assignees}
        contacts={contacts}
        deals={deals}
        editTask={editTask}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleTaskEdit}
        onDelete={handleTaskDelete}
        onComplete={handleTaskComplete}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
