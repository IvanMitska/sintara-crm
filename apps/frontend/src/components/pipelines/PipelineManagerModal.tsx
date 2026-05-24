"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
  Trash2,
  Star,
  Loader2,
  GripVertical,
  Check,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pipelinesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  pipelineId: string;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  stages?: Stage[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pipelines: Pipeline[];
  initialPipelineId?: string | null;
  onChanged: () => Promise<void> | void;
}

const COLOR_PALETTE = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#6B7280",
];

export function PipelineManagerModal({
  isOpen,
  onClose,
  pipelines,
  initialPipelineId,
  onChanged,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState(COLOR_PALETTE[0]);
  const [creatingStage, setCreatingStage] = useState(false);

  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [editingStageColor, setEditingStageColor] = useState(COLOR_PALETTE[0]);
  const [savingStageId, setSavingStageId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  const [deletePipelineOpen, setDeletePipelineOpen] = useState(false);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => pipelines.find((p) => p.id === selectedId) || null,
    [pipelines, selectedId]
  );

  const sortedStages = useMemo(
    () => [...(selected?.stages || [])].sort((a, b) => a.order - b.order),
    [selected]
  );

  // Local stages mirror for optimistic drag-reorder
  const [localStages, setLocalStages] = useState<Stage[]>(sortedStages);
  useEffect(() => {
    setLocalStages(sortedStages);
  }, [sortedStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!selected) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localStages.findIndex((s) => s.id === active.id);
    const newIndex = localStages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(localStages, oldIndex, newIndex);
    setLocalStages(next);
    try {
      await pipelinesApi.reorderStages(selected.id, next.map((s) => s.id));
      await onChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось изменить порядок");
      setLocalStages(sortedStages);
    }
  };

  // Sync selected when modal opens or pipelines change
  useEffect(() => {
    if (!isOpen) return;
    const target =
      initialPipelineId && pipelines.find((p) => p.id === initialPipelineId)
        ? initialPipelineId
        : pipelines[0]?.id || null;
    setSelectedId(target);
  }, [isOpen, initialPipelineId, pipelines]);

  // Sync form fields when selection changes
  useEffect(() => {
    setName(selected?.name || "");
    setIsDefault(!!selected?.isDefault);
    setEditingStageId(null);
  }, [selected?.id, selected?.name, selected?.isDefault]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveMeta = async () => {
    if (!selected) return;
    if (!name.trim()) {
      toast.error("Название воронки не может быть пустым");
      return;
    }
    setSavingMeta(true);
    try {
      await pipelinesApi.update(selected.id, {
        name: name.trim(),
        isDefault,
      });
      await onChanged();
      toast.success("Воронка обновлена");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось сохранить");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!createName.trim()) {
      toast.error("Введите название воронки");
      return;
    }
    setCreatingPipeline(true);
    try {
      const res = await pipelinesApi.create({ name: createName.trim() });
      await onChanged();
      setSelectedId(res.data?.id || null);
      setCreateName("");
      setCreateOpen(false);
      toast.success("Воронка создана");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось создать воронку");
    } finally {
      setCreatingPipeline(false);
    }
  };

  const handleDeletePipeline = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await pipelinesApi.delete(selected.id);
      await onChanged();
      setDeletePipelineOpen(false);
      const next = pipelines.find((p) => p.id !== selected.id);
      setSelectedId(next?.id || null);
      toast.success("Воронка удалена");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось удалить воронку");
    } finally {
      setBusy(false);
    }
  };

  const handleAddStage = async () => {
    if (!selected) return;
    if (!newStageName.trim()) {
      toast.error("Введите название стадии");
      return;
    }
    setCreatingStage(true);
    try {
      await pipelinesApi.createStage(selected.id, {
        name: newStageName.trim(),
        color: newStageColor,
      });
      await onChanged();
      setNewStageName("");
      setNewStageColor(COLOR_PALETTE[0]);
      toast.success("Стадия добавлена");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось добавить стадию");
    } finally {
      setCreatingStage(false);
    }
  };

  const startEditStage = (s: Stage) => {
    setEditingStageId(s.id);
    setEditingStageName(s.name);
    setEditingStageColor(s.color);
  };

  const handleSaveStage = async (s: Stage) => {
    if (!editingStageName.trim()) {
      toast.error("Название стадии не может быть пустым");
      return;
    }
    setSavingStageId(s.id);
    try {
      await pipelinesApi.updateStage(s.id, {
        name: editingStageName.trim(),
        color: editingStageColor,
      });
      await onChanged();
      setEditingStageId(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось сохранить стадию");
    } finally {
      setSavingStageId(null);
    }
  };

  const handleDeleteStage = async () => {
    if (!deleteStageId) return;
    setBusy(true);
    try {
      await pipelinesApi.deleteStage(deleteStageId);
      await onChanged();
      setDeleteStageId(null);
      toast.success("Стадия удалена");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Не удалось удалить стадию");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-5xl h-[85vh] bg-[#0d0d18] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white">Управление воронками</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Создавайте воронки продаж и настраивайте стадии под свои процессы
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-0">
            {/* Sidebar: pipelines list */}
            <aside className="border-r border-white/5 flex flex-col min-h-0 bg-black/20">
              <div className="p-3 border-b border-white/5">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Новая воронка
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-minimal">
                {pipelines.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl border flex items-center gap-2",
                        active
                          ? "bg-violet-500/10 border-violet-500/40"
                          : "border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm font-medium truncate", active ? "text-white" : "text-gray-300")}>
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {(p.stages?.length ?? 0)} {pluralStages(p.stages?.length ?? 0)}
                        </div>
                      </div>
                      {p.isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                {pipelines.length === 0 && (
                  <div className="text-center text-sm text-gray-500 px-4 py-8">
                    Воронок пока нет
                  </div>
                )}
              </div>
            </aside>

            {/* Editor */}
            <section className="flex flex-col min-h-0">
              {!selected ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  Выберите воронку слева или создайте новую
                </div>
              ) : (
                <>
                  {/* Pipeline meta */}
                  <div className="px-6 py-5 border-b border-white/5 space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Название воронки
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none"
                        placeholder="Например: Продажа услуг"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDefault((v) => !v)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border",
                        isDefault
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-white/[0.03] border-white/10 hover:bg-white/5"
                      )}
                      role="switch"
                      aria-checked={isDefault}
                    >
                      <div className="flex items-center gap-3">
                        <Star
                          className={cn(
                            "w-4 h-4",
                            isDefault ? "text-amber-400 fill-amber-400" : "text-gray-500"
                          )}
                        />
                        <span className="text-sm text-white">Использовать по умолчанию</span>
                      </div>
                      <div
                        className={cn(
                          "w-10 h-5 rounded-full p-0.5 flex items-center transition-colors",
                          isDefault ? "bg-amber-500" : "bg-white/10"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full bg-white transition-transform",
                            isDefault ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </div>
                    </button>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setDeletePipelineOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить воронку
                      </button>
                      <button
                        onClick={handleSaveMeta}
                        disabled={savingMeta}
                        className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                      >
                        {savingMeta && <Loader2 className="w-4 h-4 animate-spin" />}
                        Сохранить
                      </button>
                    </div>
                  </div>

                  {/* Stages */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Стадии воронки
                      </h3>
                      <span className="text-xs text-gray-500">
                        {localStages.length} {pluralStages(localStages.length)}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-2 scrollbar-minimal">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={localStages.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {localStages.map((s) => (
                            <SortableStageRow
                              key={s.id}
                              stage={s}
                              isEditing={editingStageId === s.id}
                              editingName={editingStageName}
                              editingColor={editingStageColor}
                              isSaving={savingStageId === s.id}
                              onEditingNameChange={setEditingStageName}
                              onEditingColorChange={setEditingStageColor}
                              onStartEdit={() => startEditStage(s)}
                              onCancelEdit={() => setEditingStageId(null)}
                              onSaveEdit={() => handleSaveStage(s)}
                              onDelete={() => setDeleteStageId(s.id)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>

                      {localStages.length === 0 && (
                        <div className="text-center text-sm text-gray-500 py-8">
                          В этой воронке пока нет стадий
                        </div>
                      )}
                    </div>

                    {/* Add stage row */}
                    <div className="px-6 py-4 border-t border-white/5 bg-black/20">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: newStageColor }}
                        />
                        <input
                          type="text"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddStage();
                          }}
                          placeholder="Название новой стадии"
                          className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none"
                        />
                        <button
                          onClick={handleAddStage}
                          disabled={creatingStage || !newStageName.trim()}
                          className="px-3 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                        >
                          {creatingStage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Добавить
                        </button>
                      </div>
                      <div className="mt-3">
                        <ColorPicker value={newStageColor} onChange={setNewStageColor} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Create pipeline mini-modal */}
      {createOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[100]" onClick={() => setCreateOpen(false)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-[#0d0d18] border border-white/10 rounded-2xl shadow-2xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Новая воронка</h3>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePipeline();
                  if (e.key === "Escape") setCreateOpen(false);
                }}
                placeholder="Название воронки"
                autoFocus
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none"
              />
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreatePipeline}
                  disabled={creatingPipeline || !createName.trim()}
                  className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  {creatingPipeline && <Loader2 className="w-4 h-4 animate-spin" />}
                  Создать
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={deletePipelineOpen}
        onClose={() => setDeletePipelineOpen(false)}
        onConfirm={handleDeletePipeline}
        title="Удалить воронку?"
        description={`Воронка "${selected?.name}" и все её стадии будут удалены. Сделки, привязанные к стадиям, заблокируют удаление.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={busy}
      />

      <ConfirmDialog
        isOpen={!!deleteStageId}
        onClose={() => setDeleteStageId(null)}
        onConfirm={handleDeleteStage}
        title="Удалить стадию?"
        description="Если на этой стадии есть сделки, удаление будет заблокировано."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={busy}
      />
    </>
  );
}

function SortableStageRow({
  stage,
  isEditing,
  editingName,
  editingColor,
  isSaving,
  onEditingNameChange,
  onEditingColorChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  stage: Stage;
  isEditing: boolean;
  editingName: string;
  editingColor: string;
  isSaving: boolean;
  onEditingNameChange: (v: string) => void;
  onEditingColorChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-white/[0.03] p-3",
        isDragging ? "border-violet-500/50 shadow-lg shadow-violet-500/20" : "border-white/10"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={cn(
            "p-1 -m-1 rounded touch-none flex-shrink-0",
            isEditing ? "cursor-not-allowed opacity-30" : "cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300"
          )}
          aria-label="Перетащить"
          disabled={isEditing}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {isEditing ? (
          <>
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 outline-none"
              autoFocus
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onSaveEdit}
                disabled={isSaving}
                className="p-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
                title="Сохранить"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
                title="Отменить"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span className="flex-1 text-sm text-white truncate">{stage.name}</span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={onStartEdit}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                title="Редактировать"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {isEditing && (
        <div className="mt-3 pl-7">
          <ColorPicker value={editingColor} onChange={onEditingColorChange} />
        </div>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {COLOR_PALETTE.map((c) => {
        const active = c.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "w-6 h-6 rounded-full border-2 transition",
              active ? "border-white scale-110" : "border-white/10 hover:border-white/30"
            )}
            style={{ backgroundColor: c }}
            aria-label={`Цвет ${c}`}
          />
        );
      })}
    </div>
  );
}

function pluralStages(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "стадия";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "стадии";
  return "стадий";
}
