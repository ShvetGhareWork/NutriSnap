import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { promises as fs } from "fs";
import path from "path";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LOCAL_LOG_FILE = path.join(process.cwd(), "data", "meal-log.json");

// ── GET /api/meal-log — fetch user's entries ────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // @ts-ignore
    const userId = session.user.id;

    // Check for local migration
    try {
      const data = await fs.readFile(LOCAL_LOG_FILE, "utf-8");
      const localEntries = JSON.parse(data);
      if (localEntries && localEntries.length > 0) {
        console.log(`Migrating ${localEntries.length} local logs for user ${userId}`);
        for (const entry of localEntries) {
          await fetch(`${BACKEND_URL}/api/meal-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...entry, userId })
          });
        }
        // Rename file instead of delete to be safe
        await fs.rename(LOCAL_LOG_FILE, `${LOCAL_LOG_FILE}.migrated`);
      }
    } catch (e) {
      // No local file or migration failed, ignore
    }

    const res = await fetch(`${BACKEND_URL}/api/meal-log/${userId}`);
    const json = await res.json();
    
    return NextResponse.json(json.data || []);
  } catch (error) {
    console.error("[meal-log GET]", error);
    return NextResponse.json({ error: "Failed to read log" }, { status: 500 });
  }
}

// ── POST /api/meal-log — add a new entry ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const entry = await req.json();
    if (!entry) return NextResponse.json({ error: "Invalid entry" }, { status: 400 });

    // @ts-ignore
    const userId = session.user.id;
    const res = await fetch(`${BACKEND_URL}/api/meal-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, userId })
    });
    const json = await res.json();

    return NextResponse.json(json);
  } catch (error) {
    console.error("[meal-log POST]", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

// ── DELETE /api/meal-log?id=xxx — remove one entry ───────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      // For now, only single delete is supported via this proxy
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/meal-log/${id}`, {
        method: 'DELETE'
    });
    const json = await res.json();

    return NextResponse.json(json);
  } catch (error) {
    console.error("[meal-log DELETE]", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}