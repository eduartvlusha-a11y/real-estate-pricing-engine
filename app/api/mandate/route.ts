import { NextResponse } from "next/server";

let STORE: any[] = []; // 🔥 in-memory DB

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...body
    };

    STORE.unshift(record); // newest first

    console.log("SAVED:", record);

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}

// 👉 NEW: LIST ENDPOINT
export async function GET() {
  return NextResponse.json(STORE);
}