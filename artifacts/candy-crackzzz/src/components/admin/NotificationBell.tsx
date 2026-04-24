import { useEffect, useState, useRef } from 'react';
import { Link } from 'wouter';
import { Bell, Check, Trash2 } from 'lucide-react';
import {
  apiListNotifications,
  apiSetNotificationRead,
  apiMarkAllNotificationsRead,
  apiDeleteNotification,
  type NotificationRecord,
} from '@/lib/api';

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      const result = await apiListNotifications();
      setNotifications(result.notifications);
      setUnread(result.unread);
    } catch {
      // ignore (user might be logged out)
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleRead = async (n: NotificationRecord) => {
    try {
      const result = await apiSetNotificationRead(n.id, !n.readAt);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? result.notification : x)));
      setUnread((u) => Math.max(0, u + (n.readAt ? 1 : -1)));
    } catch {
      // ignore
    }
  };

  const remove = async (n: NotificationRecord) => {
    try {
      await apiDeleteNotification(n.id);
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      if (!n.readAt) setUnread((u) => Math.max(0, u - 1));
    } catch {
      // ignore
    }
  };

  const markAll = async () => {
    try {
      await apiMarkAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const linkFor = (n: NotificationRecord): string | null => {
    if (n.relatedKind === 'message') return '/admin/messages';
    if (n.relatedKind === 'order') return '/admin/orders';
    return null;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-background">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="font-black uppercase tracking-wider text-sm">Notifications</div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs font-bold text-primary uppercase tracking-wider hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-bold text-sm">
                You're all caught up.
              </div>
            ) : (
              notifications.map((n) => {
                const href = linkFor(n);
                const body = (
                  <div
                    className={`p-3 group ${n.readAt ? 'opacity-70' : 'bg-primary/5'} hover:bg-muted/30 transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${n.readAt ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${n.readAt ? 'font-bold' : 'font-black'}`}>
                          {n.title}
                        </div>
                        {n.body && (
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 font-bold">
                            {n.body}
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1 font-bold">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleRead(n);
                          }}
                          className="p-1 hover:bg-background rounded"
                          title={n.readAt ? 'Mark as unread' : 'Mark as read'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            remove(n);
                          }}
                          className="p-1 hover:bg-background rounded text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      setOpen(false);
                      if (!n.readAt) toggleRead(n);
                    }}
                    className="block"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={n.id}>{body}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
