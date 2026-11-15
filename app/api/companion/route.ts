import { NextRequest, NextResponse } from "next/server";
import { getCompanionReply } from "@/lib/ai/companion";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const utterance = typeof body.utterance === "string" ? body.utterance.trim() : "";
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const context = typeof body.context === "string" ? body.context.slice(0, 3000) : "";

    if (!utterance || utterance.length > 1500) {
      return NextResponse.json({ error: "Please say a short request." }, { status: 400 });
    }

    const result = await getCompanionReply({ utterance, history, context });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Companion request failed", error);
    return NextResponse.json({ error: "I had a little trouble thinking that through. Please try again." }, { status: 500 });
  }
}
