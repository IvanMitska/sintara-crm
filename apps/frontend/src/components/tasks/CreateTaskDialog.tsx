"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  Flag,
  User,
  Link2,
  X,
  Plus,
  Check,
  Bell,
  Repeat,
  Paperclip,
  Tag,
  Eye,
  Timer,
  ChevronDown,
  ChevronRight,
  Briefcase,
  GripVertical,
  Send,
  Save,
  AlertCircle,
  Minus,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TaskPriority, TaskStatus, STATUS_CONFIG, Task } from "./types";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => void;
  initialStatus?: TaskStatus;
  assignees?: { id: string; name: string; avatar?: string }[];
  contacts?: { id: string; name: string }[];
  deals?: { id: string; title: string }[];
  editTask?: Task | null;
  prefillDealId?: string;
  prefillContactId?: string;
  prefillTitle?: string;
}

type ReminderType = "none" | "15min" | "30min" | "1hour" | "1day" | "custom";
type RepeatType = "none" | "daily" | "weekly" | "monthly" | "custom";

const REMINDER_OPTIONS = [
  { value: "none", labelKey: "tasks.reminderNone" },
  { value: "15min", labelKey: "tasks.reminder15min" },
  { value: "30min", labelKey: "tasks.reminder30min" },
  { value: "1hour", labelKey: "tasks.reminder1hour" },
  { value: "1day", labelKey: "tasks.reminder1day" },
];

const REPEAT_OPTIONS = [
  { value: "none", labelKey: "tasks.repeatNone" },
  { value: "daily", labelKey: "tasks.repeatDaily" },
  { value: "weekly", labelKey: "tasks.repeatWeekly" },
  { value: "monthly", labelKey: "tasks.repeatMonthly" },
];

const PRIORITY_OPTIONS = [
  {
    value: "URGENT",
    labelKey: "tasks.priorityUrgent",
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/20",
    dot: "bg-red-500"
  },
  {
    value: "HIGH",
    labelKey: "tasks.priorityHigh",
    icon: Flag,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    dot: "bg-orange-500"
  },
  {
    value: "MEDIUM",
    labelKey: "tasks.priorityMedium",
    icon: Minus,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    dot: "bg-yellow-500"
  },
  {
    value: "LOW",
    labelKey: "tasks.priorityLow",
    icon: ArrowDown,
    color: "text-green-400",
    bg: "bg-green-500/20",
    dot: "bg-green-500"
  },
];

export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  initialStatus = "PENDING",
  assignees = [],
  contacts = [],
  deals = [],
  editTask,
  prefillDealId,
  prefillContactId,
  prefillTitle,
}: CreateTaskDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [observerIds, setObserverIds] = useState<string[]>([]);
  const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [checklist, setChecklist] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [reminder, setReminder] = useState<ReminderType>("none");
  const [repeat, setRepeat] = useState<RepeatType>("none");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || "");
      setDescription(editTask.description || "");
      setPriority(editTask.priority || "MEDIUM");
      setStatus(editTask.status || initialStatus);
      setDueDate(editTask.dueDate ? editTask.dueDate.split("T")[0] : "");
      setDueTime(
        editTask.dueDate
          ? new Date(editTask.dueDate).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""
      );
      setAssigneeId(editTask.assignee?.id || "");
      setContactId(editTask.contact?.id || "");
      setDealId(editTask.deal?.id || "");
      setTags(editTask.tags || []);
      setChecklist(editTask.checklist || []);
    } else {
      resetForm();
      if (prefillDealId) setDealId(prefillDealId);
      if (prefillContactId) setContactId(prefillContactId);
      if (prefillTitle) setTitle(prefillTitle);
    }
  }, [editTask, initialStatus, open, prefillDealId, prefillContactId, prefillTitle]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);

    let fullDueDate: string | undefined;
    if (dueDate) {
      fullDueDate = dueTime
        ? `${dueDate}T${dueTime}:00`
        : `${dueDate}T23:59:00`;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    onSubmit({
      id: editTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: fullDueDate,
      assignee: assigneeId
        ? { id: assigneeId, name: assignees.find((a) => a.id === assigneeId)?.name || "" }
        : undefined,
      contact: contactId
        ? { id: contactId, name: contacts.find((c) => c.id === contactId)?.name || "" }
        : undefined,
      deal: dealId
        ? { id: dealId, title: deals.find((d) => d.id === dealId)?.title || "" }
        : undefined,
      tags: tags.length > 0 ? tags : undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
    });

    setIsSubmitting(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStatus(initialStatus);
    setDueDate("");
    setDueTime("");
    setAssigneeId("");
    setObserverIds([]);
    setContactId("");
    setDealId("");
    setTags([]);
    setNewTag("");
    setChecklist([]);
    setNewChecklistItem("");
    setReminder("none");
    setRepeat("none");
    setEstimatedTime("");
    setShowMoreOptions(false);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([
      ...checklist,
      {
        id: Date.now().toString(),
        title: newChecklistItem.trim(),
        completed: false,
      },
    ]);
    setNewChecklistItem("");
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const toggleObserver = (id: string) => {
    setObserverIds((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedAssignee = assignees.find((a) => a.id === assigneeId);
  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);

  const statusLabelKeys: Record<TaskStatus, string> = {
    PENDING: "tasks.statusPending",
    IN_PROGRESS: "tasks.statusInProgress",
    COMPLETED: "tasks.statusCompleted",
    CANCELLED: "tasks.statusCancelled",
  };

  const quickDueDates = [
    {
      label: t("tasks.today"),
      sublabel: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      getValue: () => new Date().toISOString().split("T")[0],
    },
    {
      label: t("tasks.tomorrow"),
      sublabel: new Date(Date.now() + 86400000).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      getValue: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
      },
    },
    {
      label: t("tasks.inThreeDays"),
      sublabel: new Date(Date.now() + 259200000).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      getValue: () => {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        return d.toISOString().split("T")[0];
      },
    },
    {
      label: t("tasks.inOneWeek"),
      sublabel: new Date(Date.now() + 604800000).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      getValue: () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split("T")[0];
      },
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-[#0d0d14]">
        <div className="flex flex-col h-[80vh] max-h-[800px]">
          {/* Header */}
          <div className="relative px-8 py-6 border-b border-white/5 bg-gradient-to-r from-[#0d0d14] to-[#12121a]">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {editTask ? t("tasks.editTask") : t("tasks.newTask")}
                </h2>
                <p className="text-sm text-gray-400">
                  {editTask ? t("tasks.editSubtitle") : t("tasks.createSubtitle")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ",
                  "bg-violet-500/20 text-violet-400"
                )}>
                  <div className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[status].color)} />
                  {t(statusLabelKeys[status])}
                </div>
              </div>
            </div>
            {/* Decorative line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left column - Main info */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">
                  {/* Title */}
                  <div className="space-y-2">
                    <Input
                      ref={titleRef}
                      placeholder={t("tasks.titlePlaceholder")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={cn(
                        "text-lg font-medium border-0 border-b-2 border-white/10 rounded-none px-0 h-12 bg-transparent text-white",
                        "focus-visible:ring-0 focus-visible:border-violet-500 ",
                        "placeholder:text-gray-500 placeholder:font-normal"
                      )}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-300">{t("tasks.description")}</Label>
                    <Textarea
                      placeholder={t("tasks.descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={cn(
                        "min-h-[100px] resize-none  bg-white/5 text-white",
                        "border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
                      )}
                    />
                  </div>

                  {/* Checklist */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Check className="h-4 w-4 text-gray-500" />
                        {t("tasks.checklist")}
                        {checklist.length > 0 && (
                          <span className="text-xs text-gray-500 font-normal">
                            {t("tasks.checklistProgress", { done: completedCount, total: checklist.length })}
                          </span>
                        )}
                      </Label>
                      {checklist.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full "
                              style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-400 tabular-nums">
                            {Math.round((completedCount / checklist.length) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {checklist.map((item, index) => (
                        <div
                          key={item.id}
                          className={cn(
                            "group flex items-center gap-3 p-3 rounded-lg border ",
                            "hover:border-white/10 hover:shadow-sm",
                            item.completed ? "bg-white/5 border-white/5" : "bg-[#0d0d14] border-white/10"
                          )}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: "fadeIn 0.3s ease-out forwards"
                          }}
                        >
                          <GripVertical className="h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab " />
                          <button
                            onClick={() => toggleChecklistItem(item.id)}
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-md border-2 ",
                              item.completed
                                ? "bg-violet-500 border-violet-500 text-white scale-100"
                                : "border-gray-600 hover:border-violet-500 "
                            )}
                          >
                            <Check className={cn(
                              "h-3 w-3 ",
                              item.completed ? "opacity-100 scale-100" : "opacity-0 scale-50"
                            )} />
                          </button>
                          <span
                            className={cn(
                              "flex-1 text-sm ",
                              item.completed ? "line-through text-gray-500" : "text-gray-200"
                            )}
                          >
                            {item.title}
                          </span>
                          <button
                            onClick={() => removeChecklistItem(item.id)}
                            className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100  "
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Input
                          placeholder={t("tasks.addChecklistItem")}
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addChecklistItem();
                            }
                          }}
                          className="flex-1 border-dashed border-white/10 bg-transparent text-white focus:border-violet-500 "
                        />
                        {newChecklistItem && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addChecklistItem}
                            className="  border-white/10 hover:bg-white/5"
                          >
                            {t("common.add")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      {t("tasks.tags")}
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={cn(
                            "gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/5 text-gray-300 hover:bg-white/10 ",
                            " border border-white/10"
                          )}
                          style={{
                            animationDelay: `${index * 30}ms`,
                            animation: "fadeIn 0.2s ease-out forwards"
                          }}
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 hover:bg-white/10 rounded p-0.5 "
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <div className="flex items-center">
                        <Input
                          placeholder={t("tasks.addTag")}
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          className="h-8 w-28 text-sm border-dashed border-white/10 bg-transparent text-white focus:w-36 "
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional options */}
                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white "
                    >
                      <ChevronRight className={cn(
                        "h-4 w-4 ",
                        showMoreOptions && "rotate-90"
                      )} />
                      {t("tasks.moreOptions")}
                    </button>

                    <div className={cn(
                      "grid ",
                      showMoreOptions ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                    )}>
                      <div className="overflow-hidden">
                        <div className="p-5 bg-white/5 rounded-xl space-y-4 border border-white/5">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Bell className="h-3.5 w-3.5" />
                                {t("tasks.reminder")}
                              </Label>
                              <Select value={reminder} onValueChange={(v) => setReminder(v as ReminderType)}>
                                <SelectTrigger className="bg-[#0d0d14] h-9 text-sm border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d0d14] border-white/10">
                                  {REMINDER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-gray-300 focus:bg-white/5">
                                      {t(opt.labelKey)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Repeat className="h-3.5 w-3.5" />
                                {t("tasks.repeat")}
                              </Label>
                              <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatType)}>
                                <SelectTrigger className="bg-[#0d0d14] h-9 text-sm border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d0d14] border-white/10">
                                  {REPEAT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-gray-300 focus:bg-white/5">
                                      {t(opt.labelKey)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                              <Timer className="h-3.5 w-3.5" />
                              {t("tasks.estimatedTime")}
                            </Label>
                            <Input
                              placeholder={t("tasks.estimatedTimePlaceholder")}
                              value={estimatedTime}
                              onChange={(e) => setEstimatedTime(e.target.value)}
                              className="bg-[#0d0d14] h-9 text-sm border-white/10 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-gray-400 flex items-center gap-1.5">
                              <Paperclip className="h-3.5 w-3.5" />
                              {t("tasks.files")}
                            </Label>
                            <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center hover:border-white/20 hover:bg-white/5  cursor-pointer group">
                              <Paperclip className="h-5 w-5 mx-auto text-gray-600 mb-1 group-hover:text-gray-400 " />
                              <p className="text-xs text-gray-500">
                                {t("tasks.dropFilesPrefix")} <span className="text-gray-300">{t("tasks.chooseFile")}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Divider */}
            <div className="w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5" />

            {/* Right column - Settings */}
            <div className="w-[320px] flex flex-col bg-[#0a0a10]">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Assignee */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      {t("tasks.assignee")}
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10",
                          "hover:border-white/20 hover:shadow-sm  text-left"
                        )}>
                          {selectedAssignee ? (
                            <>
                              <Avatar className="h-10 w-10 ring-2 ring-white/10">
                                <AvatarImage src={selectedAssignee.avatar} />
                                <AvatarFallback className="bg-violet-500 text-white text-sm font-medium">
                                  {getInitials(selectedAssignee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-white truncate">
                                  {selectedAssignee.name}
                                </p>
                                <p className="text-xs text-gray-500">{t("tasks.responsible")}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border-2 border-dashed border-white/20">
                                <Plus className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-500">{t("tasks.assign")}</p>
                              </div>
                            </>
                          )}
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[288px] bg-[#0d0d14] border-white/10">
                        <div className="p-2">
                          <Input placeholder={t("common.search")} className="h-8 text-sm bg-white/5 border-white/10 text-white" />
                        </div>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={() => setAssigneeId("")} className="p-2 focus:bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5">
                              <X className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="text-gray-400 text-sm">{t("tasks.unassigned")}</span>
                          </div>
                        </DropdownMenuItem>
                        {assignees.map((assignee) => (
                          <DropdownMenuItem
                            key={assignee.id}
                            onClick={() => setAssigneeId(assignee.id)}
                            className="p-2 focus:bg-white/5"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback className="text-xs bg-white/10 text-gray-300">
                                  {getInitials(assignee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm flex-1 text-gray-200">{assignee.name}</span>
                              {assigneeId === assignee.id && (
                                <Check className="h-4 w-4 text-violet-400" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Observers */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      {t("tasks.observers")}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {observerIds.map((id) => {
                        const observer = assignees.find((a) => a.id === id);
                        if (!observer) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-white/5 border border-white/10 rounded-full hover:border-white/20 "
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-white/10 text-gray-300">
                                {getInitials(observer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-300">{observer.name.split(" ")[0]}</span>
                            <button
                              onClick={() => toggleObserver(id)}
                              className="text-gray-500 hover:text-red-400 "
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 border border-dashed border-white/20 rounded-full ">
                            <Plus className="h-3 w-3" />
                            {t("common.add")}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#0d0d14] border-white/10">
                          {assignees
                            .filter((a) => a.id !== assigneeId && !observerIds.includes(a.id))
                            .map((assignee) => (
                              <DropdownMenuItem
                                key={assignee.id}
                                onClick={() => toggleObserver(assignee.id)}
                                className="focus:bg-white/5"
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-white/10 text-gray-300">
                                      {getInitials(assignee.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-gray-200">{assignee.name}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("tasks.dueDate")}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {quickDueDates.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setDueDate(item.getValue())}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-lg border text-left ",
                            dueDate === item.getValue()
                              ? "border-violet-500 bg-violet-500/20 text-white shadow-sm"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:shadow-sm"
                          )}
                        >
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className={cn(
                            "text-xs",
                            dueDate === item.getValue() ? "text-violet-300" : "text-gray-500"
                          )}>
                            {item.sublabel}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="bg-[#0d0d14] h-9 text-sm pr-8 border-white/10 text-white"
                        />
                      </div>
                      <div className="relative w-24">
                        <Input
                          type="time"
                          value={dueTime}
                          onChange={(e) => setDueTime(e.target.value)}
                          className="bg-[#0d0d14] h-9 text-sm border-white/10 text-white"
                        />
                      </div>
                    </div>
                    {dueDate && (
                      <button
                        onClick={() => {
                          setDueDate("");
                          setDueTime("");
                        }}
                        className="text-xs text-gray-500 hover:text-red-400 "
                      >
                        {t("tasks.clear")}
                      </button>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Flag className="h-3.5 w-3.5" />
                      {t("tasks.priority")}
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10",
                          "hover:border-white/20 hover:shadow-sm  text-left"
                        )}>
                          {selectedPriority && (
                            <>
                              <div className={cn("p-2 rounded-lg", selectedPriority.bg)}>
                                <selectedPriority.icon className={cn("h-4 w-4", selectedPriority.color)} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-white">
                                  {t(selectedPriority.labelKey)}
                                </p>
                              </div>
                              <div className={cn("w-2.5 h-2.5 rounded-full", selectedPriority.dot)} />
                            </>
                          )}
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[288px] bg-[#0d0d14] border-white/10">
                        {PRIORITY_OPTIONS.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => setPriority(option.value as TaskPriority)}
                            className="p-2 focus:bg-white/5"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={cn("p-2 rounded-lg", option.bg)}>
                                <option.icon className={cn("h-4 w-4", option.color)} />
                              </div>
                              <span className="text-sm flex-1 text-gray-200">{t(option.labelKey)}</span>
                              <div className={cn("w-2.5 h-2.5 rounded-full", option.dot)} />
                              {priority === option.value && (
                                <Check className="h-4 w-4 text-violet-400 ml-2" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {t("tasks.status")}
                    </Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                      <SelectTrigger className="bg-white/5 h-11 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0d14] border-white/10">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key} className="text-gray-300 focus:bg-white/5">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", config.color)} />
                              {t(statusLabelKeys[key as TaskStatus])}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CRM Links */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5" />
                      {t("tasks.links")}
                    </Label>
                    <div className="space-y-2">
                      <Select
                        value={contactId || "_none"}
                        onValueChange={(v) => setContactId(v === "_none" ? "" : v)}
                      >
                        <SelectTrigger className="bg-white/5 h-10 border-white/10 text-white">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <SelectValue placeholder={t("common.contact")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d14] border-white/10">
                          <SelectItem value="_none" className="text-gray-400 focus:bg-white/5">{t("tasks.noContact")}</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id} className="text-gray-300 focus:bg-white/5">
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={dealId || "_none"}
                        onValueChange={(v) => setDealId(v === "_none" ? "" : v)}
                      >
                        <SelectTrigger className="bg-white/5 h-10 border-white/10 text-white">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-500" />
                            <SelectValue placeholder={t("tasks.deal")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d14] border-white/10">
                          <SelectItem value="_none" className="text-gray-400 focus:bg-white/5">{t("tasks.noDeal")}</SelectItem>
                          {deals.map((deal) => (
                            <SelectItem key={deal.id} value={deal.id} className="text-gray-300 focus:bg-white/5">
                              {deal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-white/5 bg-[#0d0d14]">
            <div className="flex items-center gap-4">
              {checklist.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Check className="h-4 w-4" />
                  <span>{completedCount}/{checklist.length}</span>
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Tag className="h-4 w-4" />
                  <span>{tags.length}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                className={cn(
                  "min-w-[140px] bg-violet-500 hover:bg-violet-600 ",
                  isSubmitting && "opacity-80"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t("tasks.creating")}</span>
                  </div>
                ) : editTask ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("common.save")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("tasks.createTask")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Dialog>
  );
}
