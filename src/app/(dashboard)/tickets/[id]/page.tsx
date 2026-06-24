"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Send,
  Loader2,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  FileText,
  Image as ImageIcon,
  Shield,
  MoreVertical,
  Activity,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatRelativeDate, getStatusColor, getPriorityColor, getInitials } from "@/lib/utils";

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  customer: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
  comments: Comment[];
  attachments: Attachment[];
  activities: Activity[];
}

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; name: string; role: string };
}

interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

interface Activity {
  id: string;
  action: string;
  details: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: string; name: string };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  _count: { assignedTickets: number };
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAgentOrAdmin = session?.user?.role === "AGENT" || session?.user?.role === "ADMIN";
  const isOwner = ticket?.customer.id === session?.user?.id;
  const canManage = isAgentOrAdmin || isOwner;

  const fetchTicket = useCallback(async () => {
    const res = await fetch(`/api/tickets/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setTicket(data);
      setEditTitle(data.title);
      setEditDescription(data.description);
    }
    setLoading(false);
  }, [params.id]);

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/agents");
    if (res.ok) {
      const data = await res.json();
      setAgents(data);
    }
  }, []);

  useEffect(() => {
    fetchTicket();
    if (isAgentOrAdmin) fetchAgents();
  }, [fetchTicket, fetchAgents, isAgentOrAdmin]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);

    const res = await fetch(`/api/tickets/${params.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText, isInternal }),
    });

    if (res.ok) {
      setCommentText("");
      setIsInternal(false);
      fetchTicket();
      toast({ title: "Comment added" });
    } else {
      toast({ title: "Failed to add comment", variant: "destructive" });
    }
    setSendingComment(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/tickets/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      fetchTicket();
      toast({ title: `Status updated to ${newStatus.replace("_", " ")}` });
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    const res = await fetch(`/api/tickets/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: newPriority }),
    });

    if (res.ok) {
      fetchTicket();
      toast({ title: `Priority updated to ${newPriority}` });
    }
  };

  const handleAssign = async (agentId: string | null) => {
    const res = await fetch(`/api/tickets/${params.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });

    if (res.ok) {
      fetchTicket();
      toast({ title: "Assignment updated" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/tickets/${params.id}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      fetchTicket();
      toast({ title: "File uploaded successfully" });
    } else {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdateTicket = async () => {
    const res = await fetch(`/api/tickets/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDescription }),
    });

    if (res.ok) {
      setEditing(false);
      fetchTicket();
      toast({ title: "Ticket updated" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading || !ticket) {
    return <TicketDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="icon" className="h-9 w-9 mt-1">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold h-10"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateTicket}>
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditTitle(ticket.title); setEditDescription(ticket.description); }}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
                  {canManage && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className={getStatusColor(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    #{ticket.id.slice(0, 8)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        {isAgentOrAdmin && !editing && (
          <div className="flex gap-2 flex-wrap">
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING">Waiting</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ticket.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={ticket.assignedTo?.id || "unassigned"}
              onValueChange={(v) => handleAssign(v === "unassigned" ? null : v)}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent._count.assignedTickets})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({ticket.comments.length})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments ({ticket.attachments.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-4">
                      {ticket.comments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No comments yet</p>
                          <p className="text-sm">Be the first to comment</p>
                        </div>
                      ) : (
                        ticket.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="w-8 h-8 mt-0.5">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {getInitials(comment.author.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.author.name}</span>
                                {comment.isInternal && (
                                  <Badge variant="outline" className="text-amber-600 bg-amber-50 text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Internal
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Add Comment */}
                  <div className="p-4 border-t">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {getInitials(session?.user?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex items-center justify-between">
                          {isAgentOrAdmin && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isInternal}
                                onChange={(e) => setIsInternal(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-muted-foreground">Internal note</span>
                            </label>
                          )}
                          <Button
                            size="sm"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || sendingComment}
                          >
                            {sendingComment ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Files</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1" />
                      )}
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {ticket.attachments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No attachments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ticket.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          {attachment.mimeType.startsWith("image/") ? (
                            <ImageIcon className="w-8 h-8 text-blue-500" />
                          ) : (
                            <FileText className="w-8 h-8 text-orange-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)} · {attachment.uploadedBy.name} ·{" "}
                              {formatRelativeDate(attachment.createdAt)}
                            </p>
                          </div>
                          <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {ticket.activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No activity recorded</p>
                        </div>
                      ) : (
                        ticket.activities.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Activity className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{activity.user.name}</span>{" "}
                                <span className="text-muted-foreground">
                                  {activity.action.toLowerCase().replace("_", " ")}
                                </span>
                              </p>
                              {activity.details && (
                                <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>
                              )}
                              {activity.oldValue && activity.newValue && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {activity.oldValue} → {activity.newValue}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatRelativeDate(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Ticket Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{ticket.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{ticket.customer.email}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-sm font-medium">
                    {ticket.assignedTo?.name || (
                      <span className="text-amber-600">Unassigned</span>
                    )}
                  </p>
                  {ticket.assignedTo && (
                    <p className="text-xs text-muted-foreground">{ticket.assignedTo.email}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>

              {ticket.resolvedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                    <p className="text-sm font-medium text-emerald-600">
                      {formatDate(ticket.resolvedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {isAgentOrAdmin && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticket.status !== "RESOLVED" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleStatusChange("RESOLVED")}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Mark as Resolved
                  </Button>
                )}
                {ticket.status !== "IN_PROGRESS" && ticket.status !== "RESOLVED" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                  >
                    <Clock className="w-4 h-4 text-blue-500" />
                    Start Working
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Attach File
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-9 w-9" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
