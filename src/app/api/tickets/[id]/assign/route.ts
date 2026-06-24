import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only agents and admins can assign tickets
  if (session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { agentId } = body;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: params.id },
      data: { assignedToId: agentId || null },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    const agentName = updated.assignedTo?.name || "Unassigned";
    await tx.activityLog.create({
      data: {
        action: "ASSIGNED",
        details: `Ticket assigned to ${agentName}`,
        ticketId: params.id,
        userId: session.user.id,
      },
    });

    return updated;
  });

  return NextResponse.json(result);
}
