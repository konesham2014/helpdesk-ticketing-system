export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Customers can only view their own tickets
  if (session.user.role === "CUSTOMER" && ticket.customerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, status, priority } = body;

  const existingTicket = await prisma.ticket.findUnique({
    where: { id: params.id },
  });

  if (!existingTicket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Customers can only edit their own tickets and only title/description
  if (session.user.role === "CUSTOMER") {
    if (existingTicket.customerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status || priority) {
      return NextResponse.json({ error: "Cannot change status or priority" }, { status: 403 });
    }
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) {
    updateData.status = status;
    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }
  }
  if (priority !== undefined) updateData.priority = priority;

  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Log activity
    if (status && status !== existingTicket.status) {
      await tx.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          oldValue: existingTicket.status,
          newValue: status,
          ticketId: params.id,
          userId: session.user.id,
        },
      });
    }

    if (priority && priority !== existingTicket.priority) {
      await tx.activityLog.create({
        data: {
          action: "PRIORITY_CHANGED",
          oldValue: existingTicket.priority,
          newValue: priority,
          ticketId: params.id,
          userId: session.user.id,
        },
      });
    }

    return updated;
  });

  return NextResponse.json(ticket);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin can delete tickets
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.ticket.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "Ticket deleted" });
}
