import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { getPrivateDocument } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing document key" }, { status: 400 });
    }

    // Role check: Only the worker whose profile owns this key OR an ADMIN can access
    const isAuthorized =
      user.role === "ADMIN" ||
      (await (async () => {
        const worker = await db.query.workerProfiles.findFirst({
          where: eq(schema.workerProfiles.userId, user.id),
        });
        return worker && (worker.cnicFrontKey === key || worker.cnicBackKey === key);
      })());

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this document." },
        { status: 403 }
      );
    }

    const doc = await getPrivateDocument(key);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(doc.buffer), {
      headers: {
        "Content-Type": doc.mimeType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Document retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
