import { requireRole } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { listNotifications, unreadNotificationCount } from "@/server/services/queries";
import { MarkAllReadButton } from "./MarkAllReadButton";

export const metadata = { title: "Notifications" };

export default async function PatientNotificationsPage() {
  const user = await requireRole("PATIENT");
  const [items, unread] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationCount(user.id),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Patient portal"
        title="Notifications"
        description={
          unread > 0 ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}.` : "You're all caught up."
        }
        actions={unread > 0 ? <MarkAllReadButton /> : undefined}
      />

      <Card bare>
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-400">
            Nothing here yet — booking confirmations and status updates will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className={`px-4 py-3.5 ${n.readAt ? "" : "bg-brand-50/50"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-ink-900">{n.title}</p>
                  <span className="shrink-0 text-xs text-ink-400">
                    {n.createdAt.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-500">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
