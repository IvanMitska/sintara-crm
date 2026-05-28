"use client";

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { X, ChevronDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/language-provider";

type TranslateFn = (key: string) => string;

type TourStep = {
  targetSelector: string;
  title: string;
  description: string;
  navigateTo?: string;
};

function getTourSteps(t: TranslateFn): TourStep[] {
  return [
    {
      targetSelector: '[data-tour="dashboard"]',
      title: t("onboarding.welcomeTitle"),
      description: t("onboarding.tourDashboardDesc"),
      navigateTo: "/dashboard",
    },
    {
      targetSelector: '[data-tour="leads"]',
      title: t("onboarding.tourLeadsTitle"),
      description: t("onboarding.tourLeadsDesc"),
      navigateTo: "/leads",
    },
    {
      targetSelector: '[data-tour="deals"]',
      title: t("onboarding.tourDealsTitle"),
      description: t("onboarding.tourDealsDesc"),
      navigateTo: "/deals",
    },
    {
      targetSelector: '[data-tour="contacts"]',
      title: t("onboarding.tourContactsTitle"),
      description: t("onboarding.tourContactsDesc"),
      navigateTo: "/contacts",
    },
    {
      targetSelector: '[data-tour="companies"]',
      title: t("onboarding.tourCompaniesTitle"),
      description: t("onboarding.tourCompaniesDesc"),
      navigateTo: "/companies",
    },
    {
      targetSelector: '[data-tour="tasks"]',
      title: t("onboarding.tourTasksTitle"),
      description: t("onboarding.tourTasksDesc"),
      navigateTo: "/tasks",
    },
    {
      targetSelector: '[data-tour="messages"]',
      title: t("onboarding.tourMessagesTitle"),
      description: t("onboarding.tourMessagesDesc"),
      navigateTo: "/messages",
    },
    {
      targetSelector: '[data-tour="analytics"]',
      title: t("onboarding.tourAnalyticsTitle"),
      description: t("onboarding.tourAnalyticsDesc"),
      navigateTo: "/analytics",
    },
  ];
}

const STORAGE_KEY = "sintara-onboarding-completed";

let listeners: Array<() => void> = [];
function emitChange() {
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
function getIsCompleted() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function useOnboardingTour() {
  const isCompleted = useSyncExternalStore(subscribe, getIsCompleted, () => true);

  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitChange();
    window.dispatchEvent(new CustomEvent("onboarding-restart"));
  }, []);

  return { isCompleted, restart };
}

export default function OnboardingTour() {
  const { t } = useTranslation();
  const tourSteps = getTourSteps(t);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (getIsCompleted()) return;
    const timer = setTimeout(() => {
      setIsVisible(true);
      setReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setIsVisible(true);
      setReady(true);
    };
    window.addEventListener("onboarding-restart", handler);
    return () => window.removeEventListener("onboarding-restart", handler);
  }, []);

  const positionTooltip = useCallback(() => {
    const step = tourSteps[currentStep];
    const target = document.querySelector(step.targetSelector);
    if (!target || isMobile) return;

    const rect = target.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipHeight = tooltipEl?.offsetHeight || 200;

    let top = rect.top + rect.height / 2 - tooltipHeight / 2;
    const left = rect.right + 16;

    if (top < 12) top = 12;
    if (top + tooltipHeight > window.innerHeight - 12) {
      top = window.innerHeight - tooltipHeight - 12;
    }

    setTooltipPos({ top, left });
  }, [currentStep, isMobile, tourSteps]);

  useEffect(() => {
    if (!isVisible) return;

    const step = tourSteps[currentStep];
    if (step.navigateTo && pathname !== step.navigateTo) {
      router.push(step.navigateTo);
    }

    const timer = setTimeout(positionTooltip, 150);
    window.addEventListener("resize", positionTooltip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", positionTooltip);
    };
  }, [currentStep, isVisible, positionTooltip, pathname, router, tourSteps]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setReady(false);
    localStorage.setItem(STORAGE_KEY, "true");
    emitChange();
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  }, [currentStep, handleClose, tourSteps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleStepSelect = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  if (!isVisible || !ready) return null;

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Backdrop — no blur, just a dim overlay */}
      <div
        className="fixed inset-0 z-[99] bg-black/40"
        onClick={handleClose}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[100]",
          isMobile ? "bottom-24 left-4 right-4" : "w-[380px]"
        )}
        style={
          isMobile
            ? undefined
            : { top: tooltipPos.top, left: tooltipPos.left }
        }
      >
        <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-5">
          {/* Arrow (desktop only) */}
          {!isMobile && (
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rotate-45 bg-[#1a1a2e] border-l border-b border-white/10" />
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/25">
            <GraduationCap size={20} className="text-white" />
          </div>

          {/* Content */}
          <h3 className="text-[15px] font-semibold text-white pr-6 leading-snug">
            {step.title}
          </h3>
          <p className="mt-2 text-[13px] text-gray-400 leading-relaxed">
            {step.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <StepSelector
              steps={tourSteps}
              currentStep={currentStep}
              totalSteps={tourSteps.length}
              onSelect={handleStepSelect}
            />

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-[13px] font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {t("onboarding.back")}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-[13px] font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg hover:from-violet-600 hover:to-purple-600 transition-colors shadow-lg shadow-purple-500/25"
              >
                {isLast ? t("onboarding.finish") : t("onboarding.next")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight target element (desktop) */}
      {!isMobile && <TargetHighlight selector={step.targetSelector} />}
    </>
  );
}

function StepSelector({
  steps,
  currentStep,
  totalSteps,
  onSelect,
}: {
  steps: TourStep[];
  currentStep: number;
  totalSteps: number;
  onSelect: (step: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[13px] text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
      >
        <span className="font-medium">
          {currentStep + 1}/{totalSteps}
        </span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[101]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 z-[102] w-56 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto scrollbar-minimal">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelect(i);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
                  i === currentStep
                    ? "text-violet-300 bg-violet-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                    i === currentStep
                      ? "bg-violet-500 text-white"
                      : i < currentStep
                        ? "bg-white/10 text-green-400"
                        : "bg-white/5 text-gray-500"
                  )}
                >
                  {i < currentStep ? "\u2713" : i + 1}
                </span>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TargetHighlight({ selector }: { selector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    const timer = setTimeout(update, 150);
    return () => clearTimeout(timer);
  }, [selector]);

  if (!rect) return null;

  return (
    <div
      className="fixed z-[99] rounded-xl pointer-events-none"
      style={{
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        boxShadow: "0 0 0 2px rgba(139,92,246,0.5), 0 0 12px 2px rgba(139,92,246,0.2)",
      }}
    />
  );
}
