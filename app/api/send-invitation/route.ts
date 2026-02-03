import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  let body: { proposalId?: string; date?: string; vibe?: string; partnerName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { proposalId, date, vibe, partnerName } = body;
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

  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("your_email, partner_name")
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    return NextResponse.json(
      { error: fetchError?.message || "Proposal not found." },
      { status: 404 }
    );
  }

  const creatorEmail = proposal.your_email;
  if (!creatorEmail || typeof creatorEmail !== "string") {
    return NextResponse.json(
      { error: "No creator email found for this proposal." },
      { status: 400 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured (RESEND_API_KEY missing)." },
      { status: 500 }
    );
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || "Valentine <onboarding@resend.dev>";
  const displayPartnerName = partnerName || proposal.partner_name || "Your partner";
  const displayDate = date || "TBD";
  const displayVibe = vibe || "Surprise!";

  const subject = "She said YES! 💘";
  const text = `Congrats! ${displayPartnerName} accepted your proposal. Date: ${displayDate}, Vibe: ${displayVibe}.`;

  const { data: emailData, error: sendError } = await resend.emails.send({
    from: fromAddress,
    to: creatorEmail,
    subject,
    text,
  });

  if (sendError) {
    console.error("send-invitation Resend error:", sendError);
    return NextResponse.json(
      { error: sendError.message || "Failed to send email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: emailData?.id });
}
