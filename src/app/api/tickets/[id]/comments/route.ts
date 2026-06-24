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

  const body = await request.json();
  const { content, isInternal } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Customers can only comment on their own tickets
  if (session.user.role === "CUSTOMER" && ticket.customerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only agents/admins can create internal notes
  const isInternalNote = isInternal && session.user.role !== "CUSTOMER";

  const comment = await prisma.$transaction(async (tx) => {
    const newComment = await tx.comment.create({
      data: {
        content: content.trim(),
        isInternal: isInternalNote,
        ticketId: params.id,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    await tx.activityLog.create({
      data: {
        action: isInternalNote ? "INTERNAL_NOTE_ADDED" : "COMMENT_ADDED",
        details: isInternalNote ? "Internal note added" : "Comment added by customer",
        ticketId: params.id,
        userId: session.user.id,
      },
    });

    return newComment;
  });

  return NextResponse.json(comment, { status: 201 });
}
