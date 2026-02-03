import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// DEV ONLY: Reject in production for safety
if (process.env.NODE_ENV !== "development") {
  console.warn("dev-verify-payment is disabled in production");
}

function generateShareSlug(): string {
  return crypto.randomBytes(8).toString("base64url");
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Dev payment verification is only available in development." },
      { status: 403 }
    );
  }

  let body: { proposalId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const proposalId = body.proposalId;
  if (!proposalId || typeof proposalId !== "string") {
    return NextResponse.json(
      { error: "proposalId is required." },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const share_slug = generateShareSlug();

  const { data, error } = await supabase
    .from("proposals")
    .update({
      payment_status: "paid",
      share_slug,
    })
    .eq("id", proposalId)
    .select("share_slug")
    .single();

  if (error) {
    console.error("dev-verify-payment update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update proposal." },
      { status: 500 }
    );
  }

  const slug = data?.share_slug ?? share_slug;
  return NextResponse.json({ success: true, share_slug: slug });
}
