import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(_req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userDocuments = await db.select().from(documents).where(eq(documents.userId, userId));

    return NextResponse.json(userDocuments);
  } catch (_error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = Number(searchParams.get("documentId"));

    if (!documentId) {
      return new NextResponse("Missing document ID", { status: 400 });
    }

    // Deleting the document will cascade delete the knowledgeBase vectors
    // due to the onDelete: "cascade" set in the schema
    await db
      .delete(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));

    return new NextResponse("Document deleted", { status: 200 });
  } catch (_error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
