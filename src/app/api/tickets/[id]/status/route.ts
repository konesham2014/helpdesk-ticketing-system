import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only agents and admins can change status
  if (session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = { status };
    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }

    const updated = await tx.ticket.update({
      where: { id: params.id },
      data: updateData,
    });

    await tx.activityLog.create({
      data: {
        action: "STATUS_CHANGED",
        oldValue: ticket.status,
        newValue: status,
        ticketId: params.id,
        userId: session.user.id,
      },
    });

    return updated;
  });

  return NextResponse.json(result);
}
