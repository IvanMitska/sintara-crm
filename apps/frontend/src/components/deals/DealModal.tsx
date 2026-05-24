"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  User as UserIcon,
  Building2,
  Calendar,
  Flame,
  Thermometer,
  Snowflake,
  Tag as TagIcon,
  Sparkles,
  FileText,
  Clock,
  AlertCircle,
  Zap,
  Plus,
  ChevronDown,
} from "lucide-react";

type Temperature = "" | "HOT" | "WARM" | "COLD";
type Priority = "LOW" | "MEDIUM" | "HIGH";

interface StageOption {
  id: string;
  title: string;
  color?: string;
}

interface ContactOption {
  id: string;
  name: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: any) => void;
  deal?: any;
  stages: StageOption[];
  contacts?: ContactOption[];
  companies?: CompanyOption[];
}

interface FormData {
  title: string;
  amount: string;
  stageId: string;
  priority: Priority;
  expectedDate: string;
  contactId: string;
  contactDisplay: string;
  companyId: string;
  companyDisplay: string;
  temperature: Temperature;
  tags: string[];
  description: string;
}

const emptyForm: FormData = {
  title: "",
  amount: "",
  stageId: "",
  priority: "MEDIUM",
  expectedDate: "",
  contactId: "",
  contactDisplay: "",
  companyId: "",
  companyDisplay: "",
  temperature: "",
  tags: [],
  description: "",
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: "Низкий", color: "text-gray-400 bg-white/5 border-white/10", dot: "bg-gray-400" },
  MEDIUM: { label: "Средний", color: "text-violet-300 bg-violet-500/15 border-violet-500/40", dot: "bg-violet-400" },
  HIGH: { label: "Высокий", color: "text-red-300 bg-red-500/15 border-red-500/40", dot: "bg-red-400" },
};

const TEMP_OPTIONS: { id: Temperature; label: string; icon: any; color: string }[] = [
  { id: "", label: "Не задана", icon: Zap, color: "text-gray-400 bg-white/5 border-white/10" },
  { id: "HOT", label: "Горячая", icon: Flame, color: "text-red-400 bg-red-500/15 border-red-500/40" },
  { id: "WARM", label: "Тёплая", icon: Thermometer, color: "text-amber-400 bg-amber-500/15 border-amber-500/40" },
  { id: "COLD", label: "Холодная", icon: Snowflake, color: "text-blue-400 bg-blue-500/15 border-blue-500/40" },
];

const STEPS = [
  { id: 0, title: "Основное", subtitle: "Название, сумма, этап", icon: Briefcase },
  { id: 1, title: "Клиент", subtitle: "Контакт и компания", icon: UserIcon },
  { id: 2, title: "Детали", subtitle: "Температура, теги, описание", icon: Sparkles },
];

export function DealModal({
  isOpen,
  onClose,
  onSave,
  deal,
  stages,
  contacts = [],
  companies = [],
}: DealModalProps) {
  const { symbol, formatCompact } = useCurrency();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const contactAnchorRef = useRef<HTMLDivElement>(null);
  const contactPanelRef = useRef<HTMLDivElement>(null);
  const companyAnchorRef = useRef<HTMLDivElement>(null);
  const companyPanelRef = useRef<HTMLDivElement>(null);

  // Reset form each time modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setTagInput("");
    setContactSearch("");
    setIsContactOpen(false);
    setCompanySearch("");
    setIsCompanyOpen(false);
    const initialStageId =
      deal?.stageId && stages.some((s) => s.id === deal.stageId)
        ? deal.stageId
        : stages[0]?.id || "";
    setFormData({
      title: deal?.title || "",
      amount: deal?.amount != null ? String(deal.amount) : "",
      stageId: initialStageId,
      priority: (deal?.priority as Priority) || "MEDIUM",
      expectedDate: deal?.expectedDate ? String(deal.expectedDate).slice(0, 10) : "",
      contactId: deal?.contactId || "",
      contactDisplay:
        deal?.contact && typeof deal.contact === "object"
          ? `${deal.contact.firstName || ""} ${deal.contact.lastName || ""}`.trim()
          : typeof deal?.contact === "string"
          ? deal.contact
          : "",
      companyId: deal?.companyId || (typeof deal?.company === "object" ? deal.company?.id : "") || "",
      companyDisplay:
        typeof deal?.company === "object"
          ? deal.company?.name || ""
          : typeof deal?.company === "string"
          ? deal.company
          : "",
      temperature: (deal?.temperature as Temperature) || "",
      tags: Array.isArray(deal?.tags) ? deal.tags : [],
      description: deal?.description || "",
    });
  }, [isOpen, deal, stages]);

  // Close dropdowns when switching steps
  useEffect(() => {
    setIsContactOpen(false);
    setIsCompanyOpen(false);
  }, [step]);

  const selectedStage = useMemo(
    () => stages.find((s) => s.id === formData.stageId) || stages[0],
    [stages, formData.stageId]
  );

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts.slice(0, 8);
    return contacts
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [contacts, contactSearch]);

  const filteredCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return companies.slice(0, 8);
    return companies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [companies, companySearch]);

  const canNext =
    step === 0
      ? formData.title.trim().length > 0 && formData.amount.trim().length > 0 && !!formData.stageId
      : true;

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (formData.tags.includes(t)) {
      setTagInput("");
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, t] });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = () => {
    const payload: any = {
      title: formData.title.trim(),
      amount: parseFloat(formData.amount) || 0,
      stageId: formData.stageId,
      priority: formData.priority,
      tags: formData.tags,
      description: formData.description.trim() || undefined,
    };
    if (formData.temperature) payload.temperature = formData.temperature;
    if (formData.expectedDate) payload.expectedDate = new Date(formData.expectedDate).toISOString();
    if (formData.contactId) payload.contactId = formData.contactId;
    if (formData.companyId) payload.companyId = formData.companyId;
    onSave(payload);
    onClose();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const isEdit = !!deal?.id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 max-w-[95vw] sm:max-w-[960px] max-h-[92vh] overflow-hidden border-white/10 bg-[#0d0d18]">
        <div className="flex flex-col h-full max-h-[92vh]">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-5 border-b border-white/5">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-3 pr-10">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {isEdit ? "Редактировать сделку" : "Новая сделка"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  Шаг {step + 1} из {STEPS.length} — {STEPS[step].title}
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative mt-5 flex items-center gap-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const reached = i <= step;
                const active = i === step;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      // Allow jump backwards freely; forward only if step 0 valid
                      if (i <= step || canNext) setStep(i);
                    }}
                    className="group flex-1 flex items-center gap-3 text-left"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition",
                        active
                          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                          : reached
                          ? "bg-violet-500/30 text-violet-200"
                          : "bg-white/5 text-gray-500"
                      )}
                    >
                      {reached && !active ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                          active ? "text-white" : reached ? "text-violet-300" : "text-gray-500"
                        )}
                      >
                        {s.title}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate hidden sm:block">
                        {s.subtitle}
                      </div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "hidden sm:block h-0.5 w-8 rounded-full flex-shrink-0",
                          i < step ? "bg-violet-500" : "bg-white/10"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body: form + preview */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_320px] overflow-hidden">
            {/* Form column */}
            <div className="overflow-y-auto scrollbar-minimal p-6">
              {step === 0 && (
                <StepEssentials
                  formData={formData}
                  setFormData={setFormData}
                  stages={stages}
                  symbol={symbol}
                />
              )}
              {step === 1 && (
                <StepClient
                  formData={formData}
                  setFormData={setFormData}
                  contacts={contacts}
                  contactSearch={contactSearch}
                  setContactSearch={setContactSearch}
                  filteredContacts={filteredContacts}
                  isContactOpen={isContactOpen}
                  setIsContactOpen={setIsContactOpen}
                  contactAnchorRef={contactAnchorRef}
                  contactPanelRef={contactPanelRef}
                  companies={companies}
                  companySearch={companySearch}
                  setCompanySearch={setCompanySearch}
                  filteredCompanies={filteredCompanies}
                  isCompanyOpen={isCompanyOpen}
                  setIsCompanyOpen={setIsCompanyOpen}
                  companyAnchorRef={companyAnchorRef}
                  companyPanelRef={companyPanelRef}
                />
              )}
              {step === 2 && (
                <StepDetails
                  formData={formData}
                  setFormData={setFormData}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              )}
            </div>

            {/* Preview column */}
            <aside className="hidden md:flex flex-col border-l border-white/5 bg-black/20 p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Превью
              </div>
              <PreviewCard
                formData={formData}
                stage={selectedStage}
                formatCompact={formatCompact}
              />
              <div className="mt-auto pt-4 text-[11px] text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-violet-500" />
                  Карточка обновляется вживую
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-violet-500" />
                  Можно вернуться на любой шаг
                </div>
              </div>
            </aside>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white",
                  step === STEPS.length - 1
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30"
                    : "bg-violet-500 hover:bg-violet-600",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {step === STEPS.length - 1 ? (isEdit ? "Сохранить" : "Создать сделку") : "Далее"}
                {step !== STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Step 1 ------------------------------- */
function StepEssentials({
  formData,
  setFormData,
  stages,
  symbol,
}: {
  formData: FormData;
  setFormData: (d: FormData) => void;
  stages: StageOption[];
  symbol: string;
}) {
  return (
    <div className="space-y-6 max-w-xl">
      <Field label="Название сделки" required hint="Коротко опишите, о чём сделка">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          autoFocus
          placeholder="Например: Внедрение CRM для производства"
          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-[15px] text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none"
        />
      </Field>

      <Field label="Сумма сделки" required>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-semibold pointer-events-none">
            {symbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0"
            className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-2xl font-bold text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none"
          />
        </div>
      </Field>

      <Field label="Этап воронки" required hint="На какой стадии начинается сделка">
        {stages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {stages.map((s) => {
              const active = s.id === formData.stageId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, stageId: s.id })}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition",
                    active
                      ? "bg-violet-500/15 border-violet-500/50"
                      : "bg-white/[0.03] border-white/10 hover:bg-white/5"
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color || "#8B5CF6" }}
                  />
                  <span className={cn("text-sm truncate", active ? "text-white font-medium" : "text-gray-300")}>
                    {s.title}
                  </span>
                  {active && <Check className="w-4 h-4 text-violet-400 ml-auto flex-shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10">
            Нет стадий в текущей воронке. Сначала настройте воронку.
          </p>
        )}
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Приоритет">
          <div className="flex gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              const active = formData.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold",
                    active ? cfg.color : "text-gray-400 bg-white/[0.03] border-white/10 hover:bg-white/5"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Ожидаемая дата закрытия">
          <input
            type="date"
            value={formData.expectedDate}
            onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
            className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none [color-scheme:dark]"
          />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------- Step 2 ------------------------------- */
function StepClient({
  formData,
  setFormData,
  contacts,
  contactSearch,
  setContactSearch,
  filteredContacts,
  isContactOpen,
  setIsContactOpen,
  contactAnchorRef,
  contactPanelRef,
  companies,
  companySearch,
  setCompanySearch,
  filteredCompanies,
  isCompanyOpen,
  setIsCompanyOpen,
  companyAnchorRef,
  companyPanelRef,
}: {
  formData: FormData;
  setFormData: (d: FormData) => void;
  contacts: ContactOption[];
  contactSearch: string;
  setContactSearch: (v: string) => void;
  filteredContacts: ContactOption[];
  isContactOpen: boolean;
  setIsContactOpen: (v: boolean) => void;
  contactAnchorRef: React.RefObject<HTMLDivElement>;
  contactPanelRef: React.RefObject<HTMLDivElement>;
  companies: CompanyOption[];
  companySearch: string;
  setCompanySearch: (v: string) => void;
  filteredCompanies: CompanyOption[];
  isCompanyOpen: boolean;
  setIsCompanyOpen: (v: boolean) => void;
  companyAnchorRef: React.RefObject<HTMLDivElement>;
  companyPanelRef: React.RefObject<HTMLDivElement>;
}) {
  const selectedContact = contacts.find((c) => c.id === formData.contactId) || null;
  const selectedCompany = companies.find((c) => c.id === formData.companyId) || null;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
        <UserIcon className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300">
          <p className="font-medium text-white mb-1">Привяжите клиента (необязательно)</p>
          <p className="text-xs text-gray-500">
            Сделка может быть без контакта — привязать можно позже из карточки сделки.
          </p>
        </div>
      </div>

      <Field label="Контакт" hint="Найдите в существующих или оставьте пустым">
        {selectedContact ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {selectedContact.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 text-sm text-white font-medium truncate">
              {selectedContact.name}
            </span>
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, contactId: "", contactDisplay: "" });
                setContactSearch("");
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              title="Отвязать контакт"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div ref={contactAnchorRef} className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={contactSearch}
                onFocus={() => setIsContactOpen(true)}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setIsContactOpen(true);
                }}
                placeholder="Начните вводить имя контакта"
                className="w-full pl-10 pr-9 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none"
              />
              <ChevronDown
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition",
                  isContactOpen && "rotate-180"
                )}
              />
            </div>
            <FloatingPanel
              anchorRef={contactAnchorRef}
              panelRef={contactPanelRef}
              open={isContactOpen}
              onClose={() => setIsContactOpen(false)}
            >
              {filteredContacts.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-gray-500">
                  Не найдено. Создайте контакт в разделе «Контакты» и вернитесь сюда.
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFormData({ ...formData, contactId: c.id, contactDisplay: c.name });
                      setContactSearch("");
                      setIsContactOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-200 truncate">{c.name}</span>
                  </button>
                ))
              )}
            </FloatingPanel>
          </>
        )}
      </Field>

      <Field label="Компания" hint="Привяжите существующую или оставьте пустым">
        {selectedCompany ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/40">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-white font-medium truncate">
              {selectedCompany.name}
            </span>
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, companyId: "", companyDisplay: "" });
                setCompanySearch("");
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              title="Отвязать компанию"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div ref={companyAnchorRef} className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={companySearch}
                onFocus={() => setIsCompanyOpen(true)}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setIsCompanyOpen(true);
                }}
                placeholder="Начните вводить название"
                className="w-full pl-10 pr-9 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none"
              />
              <ChevronDown
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition",
                  isCompanyOpen && "rotate-180"
                )}
              />
            </div>
            <FloatingPanel
              anchorRef={companyAnchorRef}
              panelRef={companyPanelRef}
              open={isCompanyOpen}
              onClose={() => setIsCompanyOpen(false)}
            >
              {filteredCompanies.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-gray-500">
                  Не найдено. Создайте компанию в разделе «Компании» и вернитесь сюда.
                </div>
              ) : (
                filteredCompanies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFormData({ ...formData, companyId: c.id, companyDisplay: c.name });
                      setCompanySearch("");
                      setIsCompanyOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-gray-200 truncate">{c.name}</span>
                  </button>
                ))
              )}
            </FloatingPanel>
          </>
        )}
      </Field>
    </div>
  );
}

/* ------------------------------- Step 3 ------------------------------- */
function StepDetails({
  formData,
  setFormData,
  tagInput,
  setTagInput,
  onAddTag,
  onRemoveTag,
}: {
  formData: FormData;
  setFormData: (d: FormData) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (t: string) => void;
}) {
  return (
    <div className="space-y-6 max-w-xl">
      <Field label="Температура" hint="Насколько горячий клиент?">
        <div className="grid grid-cols-4 gap-2">
          {TEMP_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = formData.temperature === opt.id;
            return (
              <button
                key={opt.id || "none"}
                type="button"
                onClick={() => setFormData({ ...formData, temperature: opt.id })}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-semibold",
                  active ? opt.color : "text-gray-400 bg-white/[0.03] border-white/10 hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Теги" hint="Enter — добавить, × — удалить">
        <div className="space-y-2">
          <div className="relative">
            <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  onAddTag();
                }
                if (e.key === "Backspace" && !tagInput && formData.tags.length > 0) {
                  onRemoveTag(formData.tags[formData.tags.length - 1]);
                }
              }}
              placeholder="B2B, Оборудование, VIP..."
              className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none"
            />
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-medium text-violet-200"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(t)}
                    className="p-0.5 rounded hover:bg-white/10 text-violet-300"
                    title="Удалить тег"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Field>

      <Field label="Описание" hint="Контекст, договорённости, важные детали">
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Что важно знать о сделке..."
            className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 outline-none resize-none"
          />
        </div>
      </Field>
    </div>
  );
}

/* ----------------------------- FloatingPanel ----------------------------- */
function FloatingPanel({
  anchorRef,
  open,
  onClose,
  panelRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const r = anchorRef.current!.getBoundingClientRect();
      setRect({ top: r.bottom + 8, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, anchorRef, panelRef, onClose]);

  if (!open || !mounted || !rect) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        zIndex: 100,
      }}
      className="bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl shadow-black/60 py-1 max-h-[240px] overflow-y-auto scrollbar-minimal"
    >
      {children}
    </div>,
    document.body
  );
}

/* ---------------------------- Field wrapper ---------------------------- */
function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {label}
          {required && <span className="text-violet-400 ml-1">*</span>}
        </label>
        {hint && <span className="text-[11px] text-gray-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ----------------------------- Preview card ----------------------------- */
function PreviewCard({
  formData,
  stage,
  formatCompact,
}: {
  formData: FormData;
  stage?: StageOption;
  formatCompact: (n: number) => string;
}) {
  const amount = parseFloat(formData.amount) || 0;
  const tempCfg = TEMP_OPTIONS.find((t) => t.id === formData.temperature);
  const TempIcon = tempCfg?.icon;
  const prioCfg = PRIORITY_CONFIG[formData.priority];

  return (
    <div className="rounded-2xl bg-[#12121c] border border-white/5 p-4">
      {/* Stage chip */}
      {stage && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stage.color || "#8B5CF6" }}
          />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
            {stage.title}
          </span>
        </div>
      )}

      {/* Title + indicators */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-white text-[15px] leading-snug line-clamp-2 flex-1">
          {formData.title.trim() || "Название сделки"}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {tempCfg && tempCfg.id && TempIcon && (
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", tempCfg.color.split(" ").filter((c) => c.startsWith("bg-")).join(" "))}>
              <TempIcon className={cn("w-3.5 h-3.5", tempCfg.color.split(" ").filter((c) => c.startsWith("text-")).join(" "))} />
            </div>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-white">
          {amount > 0 ? formatCompact(amount) : "—"}
        </span>
      </div>

      {/* Company / Contact */}
      {formData.companyDisplay && (
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-1.5">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="truncate">{formData.companyDisplay}</span>
        </div>
      )}
      {formData.contactDisplay && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <UserIcon className="w-4 h-4 text-gray-500" />
          <span className="truncate">{formData.contactDisplay}</span>
        </div>
      )}

      {/* Tags */}
      {formData.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {formData.tags.slice(0, 3).map((t) => (
            <span key={t} className="px-2 py-0.5 bg-white/5 text-gray-300 text-xs font-medium rounded-md">
              {t}
            </span>
          ))}
          {formData.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded-md">
              +{formData.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: priority + date */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-gray-500">
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", prioCfg.color)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", prioCfg.dot)} />
          <span className="font-semibold">{prioCfg.label}</span>
        </div>
        {formData.expectedDate ? (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(formData.expectedDate).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span>Без срока</span>
          </div>
        )}
      </div>
    </div>
  );
}
