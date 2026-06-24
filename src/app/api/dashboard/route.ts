import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const isCustomer = session.user.role === "CUSTOMER";

  // Build where clause based on role
  const ticketWhere = isCustomer ? { customerId: userId } : {};

  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    highPriorityTickets,
    criticalTickets,
    recentTickets,
    ticketsByStatus,
    ticketsByPriority,
    recentActivity,
  ] = await Promise.all([
    prisma.ticket.count({ where: ticketWhere }),
    prisma.ticket.count({ where: { ...ticketWhere, status: "OPEN" } }),
    prisma.ticket.count({ where: { ...ticketWhere, status: "IN_PROGRESS" } }),
    prisma.ticket.count({ where: { ...ticketWhere, status: "RESOLVED" } }),
    prisma.ticket.count({ where: { ...ticketWhere, priority: "HIGH" } }),
    prisma.ticket.count({ where: { ...ticketWhere, priority: "CRITICAL" } }),
    prisma.ticket.findMany({
      where: ticketWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: ticketWhere,
      _count: { status: true },
    }),
    prisma.ticket.groupBy({
      by: ["priority"],
      where: ticketWhere,
      _count: { priority: true },
    }),
    prisma.activityLog.findMany({
      where: isCustomer ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true } },
        ticket: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
      highPriority: highPriorityTickets,
      critical: criticalTickets,
    },
    recentTickets,
    ticketsByStatus: ticketsByStatus.map((t) => ({
      name: t.status,
      value: t._count.status,
    })),
    ticketsByPriority: ticketsByPriority.map((t) => ({
      name: t.priority,
      value: t._count.priority,
    })),
    recentActivity,
  });
}
