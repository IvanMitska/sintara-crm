"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Building2,
  User,
  Calendar,
  SlidersHorizontal,
  Phone,
  Star,
  Settings,
  MessageSquare,
  CheckSquare,
  Check,
  Flame,
  Thermometer,
  Snowflake,
  AlertCircle,
  Clock,
  Mail,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { dealsApi, pipelinesApi, contactsApi, companiesApi, tasksApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DealModal } from "@/components/deals/DealModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { PipelineManagerModal } from "@/components/pipelines/PipelineManagerModal";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/components/providers/language-provider";

type DealTemperature = "HOT" | "WARM" | "COLD";
type DealPriority = "LOW" | "MEDIUM" | "HIGH";

interface Deal {
  id: string;
  title: string;
  amount: number;
  stageId: string;
  stage: { id: string; name: string; color: string };
  contact?: { id: string; firstName: string; lastName: string };
  company?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string | null;
  priority?: DealPriority;
  temperature?: DealTemperature | null;
  tags?: string[];
  hasOverdueTasks?: boolean;
  overdueTasksCount?: number;
  openTasksCount?: number;
  nextTask?: { id: string; title: string; dueDate: string; isOverdue: boolean } | null;
  owner?: { id: string; firstName: string; lastName: string; avatar?: string | null };
  assignee?: { id: string; name: string; avatar?: string };
}


// Quick filter types
type QuickFilter = "all" | "my" | "overdue" | "no-tasks" | "hot";

// Temperature indicator component
const TEMPERATURE_CONFIG: Record<
  DealTemperature,
  { icon: any; color: string; bg: string; labelKey: string }
> = {
  HOT: { icon: Flame, color: "text-red-500", bg: "bg-red-500/20", labelKey: "deals.hot" },
  WARM: { icon: Thermometer, color: "text-amber-500", bg: "bg-amber-500/20", labelKey: "deals.warm" },
  COLD: { icon: Snowflake, color: "text-blue-500", bg: "bg-blue-500/20", labelKey: "deals.cold" },
};

function TemperatureIndicator({ temperature }: { temperature?: DealTemperature | null }) {
  const { t } = useTranslation();
  if (!temperature) return null;
  const cfg = TEMPERATURE_CONFIG[temperature];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", cfg.bg)} title={t(cfg.labelKey)}>
      <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
    </div>
  );
}

// Manager avatar component
function ManagerAvatar({ name, avatar, size = "sm" }: { name?: string; avatar?: string; size?: "sm" | "md" }) {
  const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  const sizeClasses = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold",
      sizeClasses
    )}>
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// Deal card component for Kanban
function DealCard({
  deal,
  onClick,
  onQuickAction,
}: {
  deal: Deal;
  onClick: () => void;
  onQuickAction: (action: string, deal: Deal) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const { formatCompact } = useCurrency();
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const ownerName = deal.owner
    ? `${deal.owner.firstName || ""} ${deal.owner.lastName?.[0] || ""}${deal.owner.lastName ? "." : ""}`.trim()
    : deal.assignee?.name;
  const ownerAvatar = deal.owner?.avatar ?? deal.assignee?.avatar ?? undefined;

  const lastActivitySource = deal.lastActivityAt || deal.updatedAt || deal.createdAt;
  const lastActivityDays = lastActivitySource
    ? Math.max(0, Math.floor((Date.now() - new Date(lastActivitySource).getTime()) / 86_400_000))
    : null;

  const tags = deal.tags || [];
  const hasOverdue = !!deal.hasOverdueTasks;

  return (
    <div
      className="group glass-card rounded-2xl p-4 hover:bg-white/5 cursor-pointer border border-white/5 hover:border-violet-500/30"
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header with title and actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-white line-clamp-2 text-[15px] leading-snug flex-1">
          {deal.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <TemperatureIndicator temperature={deal.temperature} />
          {hasOverdue && (
            <div
              className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center"
              title={
                deal.overdueTasksCount && deal.overdueTasksCount > 1
                  ? t("deals.overdueTasks", { count: deal.overdueTasksCount })
                  : t("deals.overdueTaskSingle")
              }
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Amount - highlighted */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-white">{formatCompact(deal.amount)}</span>
      </div>

      {/* Company & Contact */}
      {deal.company && (
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-1.5">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="truncate">{deal.company.name}</span>
        </div>
      )}
      {deal.contact && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <User className="w-4 h-4 text-gray-500" />
          <span>{deal.contact.firstName} {deal.contact.lastName}</span>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-white/5 text-gray-300 text-xs font-medium rounded-md"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded-md">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer with manager, activity, date */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          {ownerName && <ManagerAvatar name={ownerName} avatar={ownerAvatar} />}
          {lastActivityDays !== null && lastActivityDays > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                lastActivityDays > 7 ? "text-red-500" : lastActivityDays > 3 ? "text-amber-500" : "text-gray-500"
              )}
              title={t("deals.daysSinceActivity")}
            >
              <Clock className="w-3 h-3" />
              <span>{t("deals.daysShort", { count: lastActivityDays })}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(deal.createdAt)}</span>
        </div>
      </div>

      {/* Quick action buttons - appear on hover */}
      <div className={cn(
        "flex items-center gap-1 mt-3 pt-3 border-t border-white/5",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction("call", deal); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium"
        >
          <Phone className="w-3.5 h-3.5" />
          {t("deals.actionCall")}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction("task", deal); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 text-xs font-medium"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          {t("deals.actionTask")}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onQuickAction("message", deal); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {t("deals.actionMessage")}
        </button>
      </div>
    </div>
  );
}

// Draggable wrapper around DealCard
function DraggableDealCard({
  deal,
  onClick,
  onQuickAction,
}: {
  deal: Deal;
  onClick: () => void;
  onQuickAction: (action: string, deal: Deal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { stageId: deal.stageId },
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onClick={onClick} onQuickAction={onQuickAction} />
    </div>
  );
}

// Kanban column component
function KanbanColumn({
  stage,
  deals,
  onDealClick,
  onQuickAction,
  onAddDeal,
}: {
  stage: { id: string; name: string; color: string };
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onQuickAction: (action: string, deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const stageTotal = deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const { formatCompact } = useCurrency();
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const emptyMessage = t("deals.dropHere");

  return (
    <div className={cn(
      "flex-shrink-0 glass-card rounded-2xl sm:rounded-3xl snap-start transition-shadow",
      isCollapsed ? "w-16" : "w-[280px] sm:w-[320px] md:w-[340px]",
      isOver && !isCollapsed && "ring-2 ring-violet-500/60 shadow-lg shadow-violet-500/20"
    )}>
      {/* Column Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-white/5 rounded-lg"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {!isCollapsed && (
              <>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-bold text-white text-lg">{stage.name}</h3>
              </>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => onAddDeal(stage.id)}
              className="p-2 hover:bg-white/5 rounded-xl"
            >
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3">
            <div>
              <span className="text-2xl font-bold text-white">{deals.length}</span>
              <span className="text-sm text-gray-400 ml-1">{t("deals.dealsCountLabel")}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-lg font-bold text-white">{formatCompact(stageTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Collapsed state */}
      {isCollapsed && (
        <div className="p-2 text-center">
          <div
            className="w-4 h-4 rounded-full mx-auto mb-2"
            style={{ backgroundColor: stage.color }}
          />
          <div className="text-xs font-bold text-white writing-mode-vertical transform -rotate-180" style={{ writingMode: "vertical-rl" }}>
            {stage.name}
          </div>
          <div className="mt-2 text-sm font-bold text-gray-300">{deals.length}</div>
        </div>
      )}

      {/* Cards */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            "p-4 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-minimal min-h-[120px] rounded-b-2xl sm:rounded-b-3xl transition-colors",
            isOver && "bg-violet-500/5"
          )}
        >
          {deals.map((deal) => (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal)}
              onQuickAction={onQuickAction}
            />
          ))}

          {deals.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm mb-4 min-h-[2.5rem]">{emptyMessage}</p>
              <button
                onClick={() => onAddDeal(stage.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-medium hover:bg-violet-600"
              >
                <Plus className="w-4 h-4" />
                {t("deals.addDeal")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Deal detail modal component
function DealDetailModal({
  deal,
  stages,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onQuickAction,
}: {
  deal: Deal | null;
  stages: Array<{ id: string; name: string; color: string; order: number }>;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  onQuickAction?: (action: string, deal: Deal) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "tasks" | "history">("info");
  const { format } = useCurrency();
  const { t } = useTranslation();

  if (!isOpen || !deal) return null;

  // Calculate stage progress
  const currentStageIndex = stages.findIndex(s => s.id === deal.stageId);
  const progressPercent = stages.length > 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;

  // Mock data
  const mockAssignee = deal.assignee || { name: t("deals.sampleManagerName") };
  const mockPhone = "+7 (999) 123-45-67";
  const mockEmail = "client@company.ru";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 w-full sm:max-w-xl md:max-w-2xl glass-card z-[70] overflow-hidden flex flex-col sm:border-l border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">{deal.title}</h2>
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: `${deal.stage.color}20`,
                    color: deal.stage.color,
                  }}
                >
                  {deal.stage.name}
                </span>
                {deal.company && (
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {deal.company.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Stage progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>{t("deals.funnelProgress")}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: deal.stage.color,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {stages.map((s: any, i: number) => (
                <div
                  key={s.id}
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-white/10 shadow-sm",
                    i <= currentStageIndex ? "" : "opacity-30"
                  )}
                  style={{ backgroundColor: s.color }}
                  title={s.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Amount highlight */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t("deals.dealAmount")}</p>
              <p className="text-4xl font-bold text-white">
                {format(deal.amount)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(deal)}
                className="p-3 glass-card rounded-xl hover:bg-white/5"
                title={t("common.edit")}
              >
                <Edit className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => onDelete?.(deal)}
                className="p-3 glass-card rounded-xl hover:bg-red-500/10"
                title={t("common.delete")}
              >
                <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onQuickAction?.("call", deal)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600"
            >
              <Phone className="w-5 h-5" />
              {t("deals.actionCall")}
            </button>
            <button
              onClick={() => onQuickAction?.("task", deal)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600"
            >
              <CheckSquare className="w-5 h-5" />
              {t("deals.addTask")}
            </button>
            <button
              onClick={() => onQuickAction?.("message", deal)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600"
            >
              <Mail className="w-5 h-5" />
              {t("deals.actionMessage")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-white/10">
          <div className="flex gap-1">
            {[
              { id: "info", label: t("deals.tabInfo") },
              { id: "tasks", label: t("deals.tabTasks") },
              { id: "history", label: t("deals.tabHistory") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2",
                  activeTab === tab.id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-gray-400 hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Contact section */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  {t("common.contact")}
                </h3>
                <div className="space-y-3">
                  {deal.contact && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("common.name")}</span>
                      <span className="font-medium text-white">
                        {deal.contact.firstName} {deal.contact.lastName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("common.phone")}</span>
                    <a href={`tel:${mockPhone}`} className="font-medium text-violet-400 hover:underline">
                      {mockPhone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("common.email")}</span>
                    <a href={`mailto:${mockEmail}`} className="font-medium text-violet-400 hover:underline">
                      {mockEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Deal info section */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  {t("deals.dealSingular")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("deals.responsible")}</span>
                    <div className="flex items-center gap-2">
                      <ManagerAvatar name={mockAssignee.name} size="sm" />
                      <span className="font-medium text-white">{mockAssignee.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("common.createdAt")}</span>
                    <span className="font-medium text-white">
                      {new Date(deal.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("common.updatedAt")}</span>
                    <span className="font-medium text-white">
                      {new Date(deal.updatedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company section */}
              {deal.company && (
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-500" />
                    {t("common.company")}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t("deals.titleField")}</span>
                    <span className="font-medium text-white">{deal.company.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{t("deals.sampleTaskSendProposal")}</p>
                  <p className="text-sm text-red-500">{t("deals.sampleOverdueYesterday")}</p>
                </div>
                <button className="p-2 hover:bg-red-500/20 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{t("deals.sampleTaskCallClient")}</p>
                  <p className="text-sm text-amber-500">{t("deals.sampleToday1500")}</p>
                </div>
                <button className="p-2 hover:bg-amber-500/20 rounded-xl">
                  <CheckSquare className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white line-through opacity-60">{t("deals.sampleTaskFirstContact")}</p>
                  <p className="text-sm text-green-500">{t("deals.sampleDone2DaysAgo")}</p>
                </div>
              </div>

              <button className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-gray-400 hover:border-violet-500/30 hover:text-violet-400 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                {t("deals.addTask")}
              </button>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {[
                { action: t("deals.sampleHistoryMovedStage"), detail: deal.stage.name, time: t("deals.sampleTodayTime"), color: "violet" },
                { action: t("deals.sampleHistoryCommentAdded"), detail: t("deals.sampleHistoryClientInterested"), time: t("deals.sampleYesterday1645"), color: "gray" },
                { action: t("deals.sampleHistoryCallClient"), detail: t("deals.sampleHistoryDuration5min"), time: t("deals.sampleYesterdayTime"), color: "green" },
                { action: t("deals.historyDealCreated"), detail: "", time: new Date(deal.createdAt).toLocaleDateString("ru-RU"), color: "purple" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className={cn(
                    "w-3 h-3 rounded-full mt-1.5 shrink-0",
                    item.color === "violet" ? "bg-violet-500" :
                    item.color === "green" ? "bg-green-500" :
                    item.color === "purple" ? "bg-purple-500" : "bg-gray-500"
                  )} />
                  <div className="flex-1 pb-4 border-b border-white/5 last:border-0">
                    <p className="font-medium text-white">{item.action}</p>
                    {item.detail && <p className="text-sm text-gray-400">{item.detail}</p>}
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [contactOptions, setContactOptions] = useState<{ id: string; name: string }[]>([]);
  const [companyOptions, setCompanyOptions] = useState<{ id: string; name: string }[]>([]);
  const { formatCompact, format } = useCurrency();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Modal state
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Task dialog state (for "Add task" quick action from a deal)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskDialogPrefill, setTaskDialogPrefill] = useState<any>(null);

  // Pipeline switcher + manager
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const [isPipelineManagerOpen, setIsPipelineManagerOpen] = useState(false);

  // When pipeline changes, drop any stage filters from the old pipeline
  useEffect(() => {
    setFilterStageIds(new Set());
  }, [currentPipelineId]);

  // Drag-and-drop deals between stages
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDealDragStart = (event: DragStartEvent) => {
    setActiveDealId(event.active.id as string);
  };

  const handleDealDragEnd = async (event: DragEndEvent) => {
    setActiveDealId(null);
    const { active, over } = event;
    if (!over) return;
    const dealId = active.id as string;
    const newStageId = over.id as string;
    const target = stages.find((s: any) => s.id === newStageId);
    if (!target) return;
    const dragged = deals.find((d) => d.id === dealId);
    if (!dragged || dragged.stageId === newStageId) return;

    const prev = deals;
    setDeals((curr) =>
      curr.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stageId: newStageId,
              stage: { id: target.id, name: target.name, color: target.color },
            }
          : d
      )
    );
    try {
      await dealsApi.move(dealId, newStageId);
    } catch (e: any) {
      setDeals(prev);
      toast.error(e?.response?.data?.message || t("deals.moveError"));
    }
  };

  const activeDragDeal = activeDealId
    ? deals.find((d) => d.id === activeDealId) || null
    : null;

  // Advanced filters drawer state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterStageIds, setFilterStageIds] = useState<Set<string>>(new Set());
  const [filterTemperatures, setFilterTemperatures] = useState<Set<DealTemperature>>(new Set());
  const [filterMinAmount, setFilterMinAmount] = useState<string>("");
  const [filterMaxAmount, setFilterMaxAmount] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterOnlyOverdue, setFilterOnlyOverdue] = useState(false);

  useEffect(() => {
    if (!isFiltersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFiltersOpen]);

  const activeFilterCount =
    (filterStageIds.size > 0 ? 1 : 0) +
    (filterTemperatures.size > 0 ? 1 : 0) +
    (filterMinAmount || filterMaxAmount ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (filterOnlyOverdue ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = () => {
    setFilterStageIds(new Set());
    setFilterTemperatures(new Set());
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterOnlyOverdue(false);
  };

  const pluralForm = (n: number): "One" | "Few" | "Many" => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "One";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "Few";
    return "Many";
  };

  const pluralDeal = (n: number) => t(`deals.pluralDeal${pluralForm(n)}`);
  const pluralStages = (n: number) => t(`deals.pluralStage${pluralForm(n)}`);
  const pluralPipelines = (n: number) => t(`deals.pluralPipeline${pluralForm(n)}`);

  const refreshPipelines = async () => {
    try {
      const res = await pipelinesApi.getAll();
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setPipelines(data);
      setCurrentPipelineId((prev) => {
        if (prev && data.some((p: any) => p.id === prev)) return prev;
        const def = data.find((p: any) => p.isDefault);
        return def?.id || data[0]?.id || null;
      });
    } catch (e) {
      console.error("Failed to refresh pipelines:", e);
    }
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, pipelinesRes, contactsRes, companiesRes] = await Promise.all([
          dealsApi.getAll(),
          pipelinesApi.getAll(),
          contactsApi.getAll(),
          companiesApi.getAll(),
        ]);

        const dealsData = dealsRes.data?.items || dealsRes.data?.data || dealsRes.data || [];
        setDeals(Array.isArray(dealsData) ? dealsData : []);

        const pipelinesData = Array.isArray(pipelinesRes.data) ? pipelinesRes.data : [pipelinesRes.data];
        setPipelines(pipelinesData);
        const def = pipelinesData.find((p: any) => p?.isDefault);
        setCurrentPipelineId(def?.id || pipelinesData[0]?.id || null);

        const contactsData = contactsRes.data?.items || contactsRes.data?.data || contactsRes.data || [];
        setContactOptions(
          (Array.isArray(contactsData) ? contactsData : []).map((c: any) => ({
            id: c.id,
            name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || c.phone || "—",
          }))
        );

        const companiesData = companiesRes.data?.items || companiesRes.data?.data || companiesRes.data || [];
        setCompanyOptions(
          (Array.isArray(companiesData) ? companiesData : []).map((c: any) => ({
            id: c.id,
            name: c.name || "—",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch deals:", error);
      }
    };
    fetchData();
  }, []);

  const currentPipeline = pipelines.find((p) => p.id === currentPipelineId) || pipelines[0];
  const stages = currentPipeline?.stages?.sort((a: any, b: any) => a.order - b.order) || [];

  // Memoized filtered deals
  const filteredDeals = useMemo(() => {
    const min = filterMinAmount === "" ? null : Number(filterMinAmount);
    const max = filterMaxAmount === "" ? null : Number(filterMaxAmount);
    const pipelineStageIds = new Set<string>(stages.map((s: any) => s.id));
    return deals.filter(deal => {
      if (pipelineStageIds.size > 0 && !pipelineStageIds.has(deal.stageId)) return false;
      if (selectedStage && deal.stageId !== selectedStage) return false;
      if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Quick filters
      if (quickFilter === "hot" && deal.temperature !== "HOT") {
        return false;
      }
      if (quickFilter === "overdue" && !deal.hasOverdueTasks) {
        return false;
      }
      if (quickFilter === "no-tasks" && (deal.openTasksCount || 0) > 0) {
        return false;
      }

      // Advanced filters
      if (filterStageIds.size > 0 && !filterStageIds.has(deal.stageId)) return false;
      if (filterTemperatures.size > 0 && (!deal.temperature || !filterTemperatures.has(deal.temperature))) return false;
      const amount = Number(deal.amount) || 0;
      if (min !== null && !Number.isNaN(min) && amount < min) return false;
      if (max !== null && !Number.isNaN(max) && amount > max) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(deal.createdAt) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(deal.createdAt) > to) return false;
      }
      if (filterOnlyOverdue && !deal.hasOverdueTasks) return false;

      return true;
    });
  }, [deals, stages, selectedStage, searchQuery, quickFilter, filterStageIds, filterTemperatures, filterMinAmount, filterMaxAmount, filterDateFrom, filterDateTo, filterOnlyOverdue]);

  const getDealsForStage = (stageId: string) => {
    return filteredDeals.filter(deal => deal.stageId === stageId);
  };

  const totalAmount = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
  const avgDealSize = deals.length > 0 ? totalAmount / deals.length : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const handleQuickAction = async (action: string, deal: Deal) => {
    if (action === "call") {
      if (!deal.contact?.id) {
        toast.error(t("deals.noLinkedContact"));
        return;
      }
      try {
        const res = await contactsApi.getById(deal.contact.id);
        const phone = res.data?.phone;
        if (!phone) {
          toast.error(t("deals.contactNoPhone"));
          return;
        }
        window.location.href = `tel:${phone}`;
      } catch {
        toast.error(t("deals.phoneFetchError"));
      }
      return;
    }

    if (action === "task") {
      setTaskDialogPrefill({
        dealId: deal.id,
        contactId: deal.contact?.id,
      });
      setIsTaskDialogOpen(true);
      return;
    }

    if (action === "message") {
      if (!deal.contact?.id) {
        toast.error(t("deals.noLinkedContact"));
        return;
      }
      router.push(`/messages?contactId=${deal.contact.id}`);
      return;
    }
  };

  const handleTaskDialogSubmit = async (taskData: any) => {
    try {
      const payload: any = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate,
        dealId: taskData.deal?.id || taskDialogPrefill?.dealId,
        contactId: taskData.contact?.id || taskDialogPrefill?.contactId,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await tasksApi.create(payload);
      toast.success(t("tasks.createSuccess"));
      setIsTaskDialogOpen(false);
      setTaskDialogPrefill(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("deals.taskCreateError"));
    }
  };

  // Modal handlers
  const handleOpenCreateModal = (stageId?: string) => {
    setEditingDeal(null);
    setDefaultStageId(stageId || stages[0]?.id || null);
    setIsDealModalOpen(true);
  };

  const handleOpenEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setDefaultStageId(deal.stageId);
    setIsDealModalOpen(true);
    setSelectedDeal(null);
  };

  const handleCloseModal = () => {
    setIsDealModalOpen(false);
    setEditingDeal(null);
    setDefaultStageId(null);
  };

  const handleSaveDeal = async (dealData: any) => {
    try {
      if (editingDeal?.id) {
        // Update existing deal via API
        const response = await dealsApi.update(editingDeal.id, dealData);
        const updatedDeal = response.data;
        setDeals(
          deals.map(d => d.id === editingDeal.id ? { ...d, ...updatedDeal } : d)
        );
      } else {
        // Create new deal via API
        const stageId = dealData.stageId || defaultStageId || stages[0]?.id;
        const response = await dealsApi.create({ ...dealData, stageId });
        const newDeal = response.data;
        setDeals([newDeal, ...deals]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save deal:", error);
    }
  };

  const handleAddDeal = (stageId: string) => {
    handleOpenCreateModal(stageId);
  };

  // Delete handlers
  const handleOpenDeleteDialog = (deal: Deal) => {
    setDeletingDeal(deal);
    setIsDeleteDialogOpen(true);
    setSelectedDeal(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingDeal(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDeal) return;

    setIsDeleting(true);
    try {
      await dealsApi.delete(deletingDeal.id);
      setDeals(deals.filter(d => d.id !== deletingDeal.id));
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete deal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{t("deals.title")}</h1>

              {/* Pipeline switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsPipelineMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setIsPipelineMenuOpen(false), 150)}
                  className={cn(
                    "group flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-sm text-white max-w-[260px] transition-colors",
                    isPipelineMenuOpen && "bg-white/10 border-violet-500/40"
                  )}
                  aria-expanded={isPipelineMenuOpen}
                >
                  <div
                    className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow shadow-violet-500/30"
                  >
                    <Briefcase className="w-3 h-3 text-white" />
                  </div>
                  <span className="truncate font-medium">{currentPipeline?.name || t("deals.noPipeline")}</span>
                  {currentPipeline?.isDefault && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition-transform", isPipelineMenuOpen && "rotate-180 text-violet-400")} />
                </button>

                {isPipelineMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[340px] bg-[#0d0d18] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                    {/* Subtle gradient accent */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
                      <div>
                        <h3 className="text-sm font-bold text-white">{t("deals.pipelines")}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {pipelines.length} {pluralPipelines(pipelines.length)}
                        </p>
                      </div>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsPipelineMenuOpen(false);
                          setIsPipelineManagerOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
                        title={t("deals.createPipeline")}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pipelines list */}
                    <div className="max-h-[360px] overflow-y-auto p-2 scrollbar-minimal">
                      {pipelines.map((p) => {
                        const active = p.id === currentPipelineId;
                        const sortedStages = [...(p.stages || [])].sort((a: any, b: any) => a.order - b.order);
                        return (
                          <button
                            key={p.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCurrentPipelineId(p.id);
                              setIsPipelineMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-stretch gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                              active
                                ? "bg-violet-500/15 ring-1 ring-violet-500/30"
                                : "hover:bg-white/5"
                            )}
                          >
                            <div className={cn(
                              "w-1 rounded-full flex-shrink-0",
                              active ? "bg-violet-500" : "bg-transparent"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-semibold truncate",
                                  active ? "text-white" : "text-gray-200"
                                )}>
                                  {p.name}
                                </span>
                                {p.isDefault && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                                    {t("deals.default")}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {sortedStages.length} {pluralStages(sortedStages.length)}
                              </div>
                              {sortedStages.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  {sortedStages.slice(0, 8).map((s: any) => (
                                    <span
                                      key={s.id}
                                      className="h-1.5 flex-1 rounded-full"
                                      style={{ backgroundColor: s.color, opacity: active ? 0.95 : 0.6 }}
                                      title={s.name}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="w-5 flex items-center justify-center flex-shrink-0">
                              {active && <Check className="w-4 h-4 text-violet-400" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                      {pipelines.length === 0 && (
                        <div className="px-3 py-8 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="w-5 h-5 text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-400">{t("deals.noPipelinesYet")}</p>
                          <p className="text-xs text-gray-600 mt-1">{t("deals.createFirstPipeline")}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/5 p-2 bg-black/20">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsPipelineMenuOpen(false);
                          setIsPipelineManagerOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings className="w-4 h-4 text-violet-400" />
                          <span className="font-medium">{t("deals.managePipelines")}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Pills - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">{t("deals.total")}</span>
                <span className="text-sm font-bold text-white">{deals.length}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                <span className="text-sm text-green-300">{t("deals.amount")}</span>
                <span className="text-sm font-bold text-green-300">{formatCompact(totalAmount)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg">
                <span className="text-sm text-purple-300">{t("deals.avgCheck")}</span>
                <span className="text-sm font-bold text-purple-300">{formatCompact(avgDealSize)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("deals.newDeal")}</span>
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all" as QuickFilter, label: t("deals.filterAll"), icon: Briefcase },
            { id: "my" as QuickFilter, label: t("deals.filterMine"), icon: User },
            { id: "hot" as QuickFilter, label: t("deals.filterHot"), icon: Flame },
            { id: "overdue" as QuickFilter, label: t("deals.filterOverdue"), icon: AlertCircle },
            { id: "no-tasks" as QuickFilter, label: t("deals.filterNoTasks"), icon: CheckSquare },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setQuickFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap font-medium",
                quickFilter === filter.id
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "glass-card text-gray-300 hover:bg-white/5"
              )}
            >
              <filter.icon className="w-4 h-4" />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="search"
              placeholder={t("deals.searchDeals")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-card rounded-2xl border-0 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <button
            onClick={() => setIsFiltersOpen(true)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 glass-card rounded-2xl hover:bg-white/5",
              hasActiveFilters && "ring-1 ring-violet-500/50"
            )}
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-400" />
            <span className="hidden sm:inline text-gray-300 font-medium">{t("deals.filters")}</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex glass-card rounded-2xl p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
                viewMode === "kanban"
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t("deals.viewKanban")}</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
                viewMode === "list"
                  ? "bg-violet-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">{t("deals.viewList")}</span>
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" ? (
          stages.length === 0 ? (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
                <Settings className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{t("deals.noStagesInPipeline")}</h3>
              <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
                {t("deals.noStagesInPipelineDesc")}
              </p>
              <button
                onClick={() => setIsPipelineManagerOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                {t("deals.configureStages")}
              </button>
            </div>
          ) : (
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragStart={handleDealDragStart}
              onDragEnd={handleDealDragEnd}
            >
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-minimal snap-x snap-mandatory">
                {stages.map((stage: { id: string; name: string; color: string; order: number }) => (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    deals={getDealsForStage(stage.id)}
                    onDealClick={(deal) => setSelectedDeal(deal)}
                    onQuickAction={handleQuickAction}
                    onAddDeal={handleAddDeal}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={null}>
                {activeDragDeal && (
                  <div className="rotate-2 scale-105 shadow-2xl shadow-violet-500/40 cursor-grabbing w-[280px] sm:w-[320px] md:w-[340px]">
                    <DealCard
                      deal={activeDragDeal}
                      onClick={() => {}}
                      onQuickAction={() => {}}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )
        ) : (
          /* List View */
          <div className="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("deals.dealSingular")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("deals.amount")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("deals.stage")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("common.company")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("deals.responsible")}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {t("deals.date")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="hover:bg-white/5 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <TemperatureIndicator temperature={deal.temperature} />
                          <p className="font-semibold text-white">{deal.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">
                          {format(deal.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${deal.stage.color}15`,
                            color: deal.stage.color,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: deal.stage.color }}
                          />
                          {deal.stage.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {deal.company?.name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ManagerAvatar name={t("deals.sampleManagerShort")} size="sm" />
                          <span className="text-gray-300">{t("deals.sampleManagerShort")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {formatDate(deal.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredDeals.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">{t("deals.noDealsFound")}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        stages={stages}
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteDialog}
        onQuickAction={handleQuickAction}
      />

      {/* Deal Create/Edit Modal */}
      <DealModal
        isOpen={isDealModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDeal}
        deal={editingDeal ? {
          ...editingDeal,
          stageId: editingDeal.stageId || defaultStageId || stages[0]?.id,
        } : defaultStageId ? { stageId: defaultStageId } : undefined}
        stages={stages.map((s: any) => ({ id: s.id, title: s.name, color: s.color }))}
        contacts={contactOptions}
        companies={companyOptions}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title={t("deals.deleteConfirm")}
        description={t("deals.deleteConfirmDescNamed", { title: deletingDeal?.title ?? "" })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Create Task from Deal */}
      <CreateTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setTaskDialogPrefill(null);
        }}
        onSubmit={handleTaskDialogSubmit}
        contacts={contactOptions}
        deals={deals.map((d) => ({ id: d.id, title: d.title }))}
        prefillDealId={taskDialogPrefill?.dealId}
        prefillContactId={taskDialogPrefill?.contactId}
      />

      {/* Pipeline manager */}
      <PipelineManagerModal
        isOpen={isPipelineManagerOpen}
        onClose={() => setIsPipelineManagerOpen(false)}
        pipelines={pipelines}
        initialPipelineId={currentPipelineId}
        onChanged={refreshPipelines}
      />

      {/* Filters drawer */}
      {isFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={() => setIsFiltersOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-[70] flex flex-col shadow-2xl border-l border-white/10 bg-[#0d0d18]">
            {/* gradient accent at top */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">{t("deals.filters")}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activeFilterCount > 0 ? t("deals.activeFiltersCount", { count: activeFilterCount }) : t("deals.noFiltersSelected")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white"
                aria-label={t("deals.closeFilters")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto p-5 space-y-4 scrollbar-minimal">
              {/* Stages section */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t("deals.stage")}</h3>
                  {filterStageIds.size > 0 && (
                    <button
                      onClick={() => setFilterStageIds(new Set())}
                      className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold"
                    >
                      {t("deals.clear")}
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {stages.map((s: any) => {
                    const checked = filterStageIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const next = new Set(filterStageIds);
                          if (checked) next.delete(s.id);
                          else next.add(s.id);
                          setFilterStageIds(next);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left",
                          checked
                            ? "bg-violet-500/10 border-violet-500/40"
                            : "bg-transparent border-transparent hover:bg-white/5"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0",
                            checked ? "bg-violet-500 border-violet-500" : "border-white/20"
                          )}
                        >
                          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className={cn("text-sm flex-1 truncate", checked ? "text-white" : "text-gray-300")}>
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                  {stages.length === 0 && (
                    <p className="text-sm text-gray-500 px-3 py-2">{t("deals.noStagesInFunnel")}</p>
                  )}
                </div>
              </div>

              {/* Temperature section */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">{t("deals.temperature")}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "HOT" as DealTemperature, label: t("deals.filterHot"), icon: Flame, color: "text-red-400 bg-red-500/15 border-red-500/40 shadow-red-500/20" },
                    { id: "WARM" as DealTemperature, label: t("deals.filterWarm"), icon: Thermometer, color: "text-amber-400 bg-amber-500/15 border-amber-500/40 shadow-amber-500/20" },
                    { id: "COLD" as DealTemperature, label: t("deals.filterCold"), icon: Snowflake, color: "text-blue-400 bg-blue-500/15 border-blue-500/40 shadow-blue-500/20" },
                  ].map((temp) => {
                    const active = filterTemperatures.has(temp.id);
                    const Icon = temp.icon;
                    return (
                      <button
                        key={temp.id}
                        type="button"
                        onClick={() => {
                          const next = new Set(filterTemperatures);
                          if (active) next.delete(temp.id);
                          else next.add(temp.id);
                          setFilterTemperatures(next);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-semibold border",
                          active
                            ? `${temp.color} shadow-lg`
                            : "text-gray-400 bg-white/[0.02] border-white/10 hover:bg-white/5 hover:text-gray-300"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {temp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount section */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">{t("deals.dealAmount")}</h3>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 uppercase">{t("deals.filterFrom")}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none"
                    />
                  </div>
                  <span className="text-gray-600">—</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 uppercase">{t("deals.filterTo")}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="∞"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Date section */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">{t("deals.creationDate")}</h3>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none [color-scheme:dark]"
                  />
                  <span className="text-gray-600">—</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none [color-scheme:dark]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[
                    { labelKey: "deals.presetToday", days: 0 },
                    { labelKey: "deals.preset7Days", days: 7 },
                    { labelKey: "deals.preset30Days", days: 30 },
                    { labelKey: "deals.preset90Days", days: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.labelKey}
                      type="button"
                      onClick={() => {
                        const to = new Date();
                        const from = new Date();
                        from.setDate(from.getDate() - preset.days);
                        const fmt = (d: Date) => d.toISOString().slice(0, 10);
                        setFilterDateFrom(fmt(from));
                        setFilterDateTo(fmt(to));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300"
                    >
                      {t(preset.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle: only overdue */}
              <button
                type="button"
                onClick={() => setFilterOnlyOverdue((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-between gap-4 p-4 rounded-2xl border text-left",
                  filterOnlyOverdue
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                )}
                role="switch"
                aria-checked={filterOnlyOverdue}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    filterOnlyOverdue ? "bg-red-500/30" : "bg-red-500/15"
                  )}>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{t("deals.onlyOverdue")}</div>
                    <div className="text-xs text-gray-500 truncate">{t("deals.onlyOverdueDesc")}</div>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-11 h-6 rounded-full p-0.5 flex items-center transition-colors flex-shrink-0",
                    filterOnlyOverdue ? "bg-violet-500" : "bg-white/10"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                      filterOnlyOverdue ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="relative px-5 py-4 border-t border-white/5 bg-[#0a0a14] flex items-center gap-3">
              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="px-4 py-3 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {t("common.reset")}
              </button>
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30"
              >
                {t("deals.showCount", { count: filteredDeals.length })} {pluralDeal(filteredDeals.length)}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
