"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Plus,
  Play,
  Pencil,
  Trash2,
  Loader2,
  Power,
  Clock,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { automationApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";

interface AutomationTrigger {
  type: string;
  config?: Record<string, any>;
}

interface AutomationAction {
  type: string;
  config: Record<string, any>;
}

interface Automation {
  id: string;
  name: string;
  description?: string | null;
  trigger: AutomationTrigger;
  conditions?: any[] | null;
  actions: AutomationAction[];
  isActive: boolean;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Maps enum value -> translation key (resolved via t() at render)
const TRIGGER_LABEL_KEYS: Record<string, string> = {
  deal_stage_changed: "automation.triggerDealStageChanged",
  deal_created: "automation.triggerDealCreated",
  deal_won: "automation.triggerDealWon",
  deal_lost: "automation.triggerDealLost",
  contact_created: "automation.triggerContactCreated",
  task_created: "automation.triggerTaskCreated",
  task_overdue: "automation.triggerTaskOverdue",
  lead_created: "automation.triggerLeadCreated",
  lead_status_changed: "automation.triggerLeadStatusChanged",
  lead_converted: "automation.triggerLeadConverted",
};

const ACTION_LABEL_KEYS: Record<string, string> = {
  create_task: "automation.actionCreateTask",
  send_notification: "automation.actionSendNotification",
  update_field: "automation.actionUpdateField",
  assign_owner: "automation.actionAssignOwner",
  add_tag: "automation.actionAddTag",
};

const TRIGGER_VALUES = Object.keys(TRIGGER_LABEL_KEYS);
const ACTION_VALUES = Object.keys(ACTION_LABEL_KEYS);

export default function AutomationPage() {
  const { t } = useTranslation();

  const formatRelativeTime = (dateString?: string | null) => {
    if (!dateString) return t("automation.never");
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("notifications.justNow");
    if (mins < 60) return t("notifications.minAgo", { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("notifications.hourAgo", { count: hrs });
    const days = Math.floor(hrs / 24);
    return t("notifications.dayAgo", { count: days });
  };

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const res = await automationApi.getAll();
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setAutomations(list);
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("automation.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (a: Automation) => {
    try {
      await automationApi.update(a.id, { isActive: !a.isActive });
      setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, isActive: !a.isActive } : x)));
      toast.success(!a.isActive ? t("automation.enabledToast") : t("automation.disabledToast"));
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("automation.updateError"));
    }
  };

  const handleExecute = async (a: Automation) => {
    setRunningId(a.id);
    try {
      await automationApi.execute(a.id);
      toast.success(t("automation.executedToast"));
      await fetchAutomations();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("automation.executeError"));
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await automationApi.delete(deleteTarget.id);
      setAutomations((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(t("automation.deleteSuccess"));
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("automation.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaved = (saved: Automation) => {
    setAutomations((prev) => {
      const exists = prev.find((x) => x.id === saved.id);
      return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
    });
    setIsModalOpen(false);
    setEditing(null);
  };

  const active = automations.filter((a) => a.isActive).length;
  const inactive = automations.length - active;

  return (
    <div className="min-h-full">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] md:text-[34px] font-bold text-white tracking-tight">
              {t("automation.title")}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t("automation.subtitle")}
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("automation.newAutomation")}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{automations.length}</p>
                <p className="text-xs text-gray-500">{t("automation.total")}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Power className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{active}</p>
                <p className="text-xs text-gray-500">{t("automation.activeCount")}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <Power className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{inactive}</p>
                <p className="text-xs text-gray-500">{t("automation.inactiveCount")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : automations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{t("automation.noAutomations")}</h3>
            <p className="text-gray-500 text-sm mb-6">
              {t("automation.emptyDesc")}
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-500"
            >
              <Plus className="w-5 h-5" />
              {t("automation.newAutomation")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4",
                  !a.isActive && "opacity-70"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{a.name}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium",
                        a.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {a.isActive ? t("automation.active") : t("automation.statusOff")}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      {t("automation.trigger")}: {a.trigger?.type ? (TRIGGER_LABEL_KEYS[a.trigger.type] ? t(TRIGGER_LABEL_KEYS[a.trigger.type]) : a.trigger.type) : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Workflow className="w-3.5 h-3.5" />
                      {t("automation.actionsCountLabel")}: {Array.isArray(a.actions) ? a.actions.length : 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {t("automation.lastRun")}: {formatRelativeTime(a.lastRunAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(a)}
                    title={a.isActive ? t("automation.disable") : t("automation.enable")}
                    className={cn(
                      "p-2.5 rounded-xl",
                      a.isActive
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    )}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExecute(a)}
                    disabled={runningId === a.id || !a.isActive}
                    title={t("automation.runNow")}
                    className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-40"
                  >
                    {runningId === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(a);
                      setIsModalOpen(true);
                    }}
                    title={t("common.edit")}
                    className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    title={t("common.delete")}
                    className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AutomationModal
          automation={editing}
          onClose={() => {
            setIsModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("automation.deleteConfirm")}
        description={t("automation.deleteConfirmDesc", { name: deleteTarget?.name || "" })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function AutomationModal({
  automation,
  onClose,
  onSaved,
}: {
  automation: Automation | null;
  onClose: () => void;
  onSaved: (a: Automation) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(automation?.name || "");
  const [description, setDescription] = useState(automation?.description || "");
  const [triggerType, setTriggerType] = useState(automation?.trigger?.type || "deal_created");
  const [isActive, setIsActive] = useState(automation?.isActive ?? true);
  const [actions, setActions] = useState<AutomationAction[]>(
    automation?.actions?.length ? automation.actions : [{ type: "create_task", config: {} }]
  );
  const [saving, setSaving] = useState(false);

  const addAction = () => setActions((a) => [...a, { type: "create_task", config: {} }]);
  const removeAction = (i: number) => setActions((a) => a.filter((_, idx) => idx !== i));
  const updateAction = (i: number, patch: Partial<AutomationAction>) =>
    setActions((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch, config: { ...x.config, ...(patch.config || {}) } } : x)));

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("automation.enterName"));
      return;
    }
    if (actions.length === 0) {
      toast.error(t("automation.addAtLeastOneAction"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        trigger: { type: triggerType },
        actions,
        isActive,
      };
      const res = automation
        ? await automationApi.update(automation.id, payload)
        : await automationApi.create(payload);
      onSaved(res.data);
      toast.success(automation ? t("automation.savedToast") : t("automation.createSuccess"));
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("automation.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 w-full sm:max-w-xl glass-card z-[70] overflow-hidden flex flex-col sm:border-l border-white/10">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {automation ? t("automation.editAutomation") : t("automation.newAutomation")}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {t("automation.modalSubtitle")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t("automation.name")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("automation.namePlaceholder")}
              className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-500 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t("automation.description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t("automation.descriptionPlaceholder")}
              className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white placeholder-gray-500 border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t("automation.trigger")}</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm text-white border border-white/10 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {TRIGGER_VALUES.map((value) => (
                <option key={value} value={value} className="bg-[#0a0a0f]">
                  {t(TRIGGER_LABEL_KEYS[value])}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">{t("automation.actions")}</label>
              <button
                onClick={addAction}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t("common.add")}
              </button>
            </div>
            <div className="space-y-3">
              {actions.map((act, i) => (
                <div key={i} className="glass-card rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={act.type}
                      onChange={(e) => updateAction(i, { type: e.target.value, config: {} })}
                      className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white border border-white/10"
                    >
                      {ACTION_VALUES.map((value) => (
                        <option key={value} value={value} className="bg-[#0a0a0f]">
                          {t(ACTION_LABEL_KEYS[value])}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeAction(i)}
                      disabled={actions.length === 1}
                      className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-400 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <ActionConfig
                    action={act}
                    onChange={(cfg) => updateAction(i, { config: cfg })}
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
            />
            <span className="text-sm text-gray-300">{t("automation.activeImmediately")}</span>
          </label>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {automation ? t("common.save") : t("common.create")}
          </button>
        </div>
      </div>
    </>
  );
}

function ActionConfig({
  action,
  onChange,
}: {
  action: AutomationAction;
  onChange: (cfg: Record<string, any>) => void;
}) {
  const { t } = useTranslation();
  const cfg = action.config || {};
  const set = (k: string, v: any) => onChange({ ...cfg, [k]: v });

  if (action.type === "create_task") {
    return (
      <div className="space-y-2">
        <input
          value={cfg.taskTitle || ""}
          onChange={(e) => set("taskTitle", e.target.value)}
          placeholder={t("automation.taskTitlePlaceholder")}
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <input
          value={cfg.taskDescription || ""}
          onChange={(e) => set("taskDescription", e.target.value)}
          placeholder={t("automation.description")}
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={cfg.taskDueDays || ""}
            onChange={(e) => set("taskDueDays", Number(e.target.value) || undefined)}
            placeholder={t("automation.taskDueDaysPlaceholder")}
            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
          />
          <select
            value={cfg.taskPriority || "MEDIUM"}
            onChange={(e) => set("taskPriority", e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white border border-white/10"
          >
            <option value="LOW" className="bg-[#0a0a0f]">{t("tasks.priorityLow")}</option>
            <option value="MEDIUM" className="bg-[#0a0a0f]">{t("tasks.priorityMedium")}</option>
            <option value="HIGH" className="bg-[#0a0a0f]">{t("tasks.priorityHigh")}</option>
            <option value="URGENT" className="bg-[#0a0a0f]">{t("tasks.priorityUrgent")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={!!cfg.assignToOwner}
            onChange={(e) => set("assignToOwner", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500"
          />
          {t("automation.assignToOwner")}
        </label>
      </div>
    );
  }

  if (action.type === "send_notification") {
    return (
      <div className="space-y-2">
        <input
          value={cfg.notificationTitle || ""}
          onChange={(e) => set("notificationTitle", e.target.value)}
          placeholder={t("automation.notificationTitlePlaceholder")}
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <input
          value={cfg.notificationContent || ""}
          onChange={(e) => set("notificationContent", e.target.value)}
          placeholder={t("automation.notificationContentPlaceholder")}
          className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={!!cfg.notifyOwner}
            onChange={(e) => set("notifyOwner", e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500"
          />
          {t("automation.notifyOwner")}
        </label>
      </div>
    );
  }

  if (action.type === "update_field") {
    return (
      <div className="flex gap-2">
        <input
          value={cfg.fieldName || ""}
          onChange={(e) => set("fieldName", e.target.value)}
          placeholder={t("automation.fieldNamePlaceholder")}
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
        <input
          value={cfg.fieldValue ?? ""}
          onChange={(e) => set("fieldValue", e.target.value)}
          placeholder={t("automation.fieldValuePlaceholder")}
          className="flex-1 px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
        />
      </div>
    );
  }

  if (action.type === "assign_owner") {
    return (
      <input
        value={cfg.newOwnerId || ""}
        onChange={(e) => set("newOwnerId", e.target.value)}
        placeholder={t("automation.userIdPlaceholder")}
        className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
      />
    );
  }

  if (action.type === "add_tag") {
    return (
      <input
        value={cfg.tagId || ""}
        onChange={(e) => set("tagId", e.target.value)}
        placeholder={t("automation.tagIdPlaceholder")}
        className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10"
      />
    );
  }

  return null;
}
