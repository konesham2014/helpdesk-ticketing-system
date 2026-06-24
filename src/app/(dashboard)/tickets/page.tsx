"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate, getStatusColor, getPriorityColor } from "@/lib/utils";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  customer: { name: string; email: string };
  assignedTo: { name: string; email: string } | null;
  _count: { comments: number; attachments: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [assignedTo, setAssignedTo] = useState<string>("all");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (priority !== "all") params.set("priority", priority);
    if (assignedTo !== "all") params.set("assignedTo", assignedTo);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("page", pagination.page.toString());
    params.set("limit", pagination.limit.toString());

    const res = await fetch(`/api/tickets?${params}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setPagination(data.pagination);
    setLoading(false);
  }, [search, status, priority, sortBy, sortOrder, assignedTo, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  const isAgentOrAdmin = session?.user?.role === "AGENT" || session?.user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all support tickets
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>

              {isAgentOrAdmin && (
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Assigned To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="me">Assigned to Me</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("title")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Ticket <SortIcon field="title" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("priority")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Priority <SortIcon field="priority" />
                  </button>
                </th>
                {isAgentOrAdmin && (
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                )}
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Created <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3 px-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-5 w-20" /></td>
                    {isAgentOrAdmin && <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>}
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td></td>
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={isAgentOrAdmin ? 7 : 6} className="py-12 text-center text-muted-foreground">
                    No tickets found matching your criteria
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="block"
                      >
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {ticket._count.comments > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              {ticket._count.comments}
                            </span>
                          )}
                          {ticket._count.attachments > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Paperclip className="w-3 h-3" />
                              {ticket._count.attachments}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    {isAgentOrAdmin && (
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {ticket.customer.name}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {ticket.assignedTo?.name || (
                        <span className="text-amber-600 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatRelativeDate(ticket.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tickets/${ticket.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {isAgentOrAdmin && (
                            <DropdownMenuItem asChild>
                              <Link href={`/tickets/${ticket.id}`}>Manage Ticket</Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} tickets
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
