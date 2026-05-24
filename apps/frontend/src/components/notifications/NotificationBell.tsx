"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Briefcase,
  Users,
  CheckCircle2,
  Zap,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  metadata?: any;
  readAt?: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, any> = {
  deal_created: Briefcase,
  deal_stage_changed: Briefcase,
  deal_won: Briefcase,
  deal_lost: Briefcase,
  contact_created: Users,
  task_created: CheckCircle2,
  task_completed: CheckCircle2,
  task_assigned: CheckCircle2,
  task_overdue: AlertCircle,
  lead_created: Zap,
  lead_converted: Zap,
};

function formatRelative(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} д назад`;
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      const count = typeof res.data === "number" ? res.data : res.data?.count ?? 0;
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.items || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.isRead).length);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  }, []);

  // initial count + poll
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // 1 min
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // fetch full list when opened
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleMarkAsRead = async (n: Notification) => {
    if (n.isRead) return;
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markAsRead(n.id);
    } catch {
      // rollback on error
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x))
      );
      setUnreadCount((c) => c + 1);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    const prev = notifications;
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllAsRead();
      toast.success("Все уведомления прочитаны");
    } catch (e: any) {
      setNotifications(prev);
      fetchUnreadCount();
      toast.error(e.response?.data?.message || "Не удалось обновить");
    }
  };

  const handleDelete = async (n: Notification) => {
    const prev = notifications;
    setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.delete(n.id);
    } catch (e: any) {
      setNotifications(prev);
      fetchUnreadCount();
      toast.error(e.response?.data?.message || "Не удалось удалить");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 rounded-xl hover:bg-white/10"
        aria-label="Уведомления"
      >
        <Bell size={20} className="text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0d0d14]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden z-[100] border border-white/10"
          style={{
            background: "rgba(15, 15, 23, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-[15px]">Уведомления</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-violet-500/25 text-violet-300 text-[11px] font-semibold">
                  {unreadCount} новых
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 font-medium"
                title="Отметить все прочитанными"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Всё прочитано
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">Пока нет уведомлений</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "group relative flex gap-3 px-5 py-3.5 hover:bg-white/[0.04] cursor-pointer transition-colors",
                        !n.isRead && "bg-violet-500/[0.08]"
                      )}
                      onClick={() => handleMarkAsRead(n)}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/[0.06]">
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            n.isRead ? "text-gray-500" : "text-gray-300"
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p
                            className={cn(
                              "text-sm font-semibold flex-1 leading-snug",
                              n.isRead ? "text-gray-400" : "text-white"
                            )}
                          >
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-1 leading-relaxed line-clamp-2",
                            n.isRead ? "text-gray-500" : "text-gray-300"
                          )}
                        >
                          {n.content}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(n);
                            }}
                            title="Отметить прочитанным"
                            className="p-1 rounded-md text-gray-400 hover:bg-white/10 hover:text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n);
                          }}
                          title="Удалить"
                          className="p-1 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
