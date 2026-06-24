"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Activity, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate, formatDate } from "@/lib/utils";
import Link from "next/link";

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string };
  ticket: { id: string; title: string } | null;
}

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/activity?page=${page}&limit=20`);
    const data = await res.json();
    setActivities(data.activities || []);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      TICKET_CREATED: "📝",
      STATUS_CHANGED: "🔄",
      PRIORITY_CHANGED: "⚡",
      ASSIGNED: "👤",
      COMMENT_ADDED: "💬",
      INTERNAL_NOTE_ADDED: "🔒",
      ATTACHMENT_UPLOADED: "📎",
    };
    return icons[action] || "📋";
  };

  const getActionLabel = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          Track all changes and actions across the system
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No activity yet</p>
              <p className="text-sm">Actions will appear here as they happen</p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{activity.user.name}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {getActionLabel(activity.action)}
                      </Badge>
                      {activity.oldValue && activity.newValue && (
                        <span className="text-xs text-muted-foreground">
                          {activity.oldValue} → {activity.newValue}
                        </span>
                      )}
                    </div>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-0.5">{activity.details}</p>
                    )}
                    {activity.ticket && (
                      <Link
                        href={`/tickets/${activity.ticket.id}`}
                        className="text-sm text-primary hover:underline mt-0.5 inline-block"
                      >
                        {activity.ticket.title}
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
