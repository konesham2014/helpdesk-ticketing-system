export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketStatus, TicketPriority } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as TicketPriority | null;
  const assignedTo = searchParams.get("assignedTo") || null;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: any = {};

  // Role-based filtering
  if (session.user.role === "CUSTOMER") {
    where.customerId = session.user.id;
  } else if (session.user.role === "AGENT" && assignedTo === "me") {
    where.assignedToId = session.user.id;
  }

  // Search
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filters
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo && assignedTo !== "me" && assignedTo !== "unassigned") {
    where.assignedToId = assignedTo;
  } else if (assignedTo === "unassigned") {
    where.assignedToId = null;
  }

  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, priority } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 }
    );
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const newTicket = await tx.ticket.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        customerId: session.user.id,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.activityLog.create({
      data: {
        action: "TICKET_CREATED",
        details: `Ticket created: "${title}"`,
        ticketId: newTicket.id,
        userId: session.user.id,
      },
    });

    return newTicket;
  });

  return NextResponse.json(ticket, { status: 201 });
}
