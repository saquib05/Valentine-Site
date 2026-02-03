import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  // 1. Handle the API Key safely (Force it to be a string)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is missing in env variables." },
      { status: 500 }
    );
  }
  const resend = new Resend(resendApiKey);

  // 2. Parse the body
  let body: any; 
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { proposalId, date, vibe, partnerName } = body;

  if (!proposalId) {
    return NextResponse.json({ error: "proposalId is required" }, { status: 400 });
  }

  // 3. Setup Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 4. Fetch Proposal (Select ALL columns to avoid 'missing column' errors)
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("*") 
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    console.error("Proposal Fetch Error:", fetchError);
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // 5. Get Email (Handle different column names safely)
  // We treat proposal as 'any' type so TypeScript doesn't complain about property names
  const proposalData = proposal as any;
  const creatorEmail = proposalData.creator_email || proposalData.your_email;

  if (!creatorEmail) {
    return NextResponse.json(
      { error: "Creator email not found in database record." },
      { status: 400 }
    );
  }

  // 6. Send Email
  try {
    const { data: emailData, error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Valentine <onboarding@resend.dev>",
      to: creatorEmail,
      subject: "She said YES! 💘",
      text: `Congrats! ${partnerName || "Your partner"} accepted your proposal.\n\nDate: ${date || "TBD"}\nVibe: ${vibe || "Surprise!"}`,
    });

    if (sendError) {
      console.error("Resend Error:", sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: emailData?.id });

  } catch (err: any) {
    console.error("Unexpected Email Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}