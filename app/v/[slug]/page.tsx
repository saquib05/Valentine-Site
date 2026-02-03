"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";

type Proposal = {
  id: string;
  partner_name: string | null;
  photo_url: string | null;
  payment_status: string | null;
};

const HOVER_RADIUS = 120;
const BUTTON_WIDTH = 120;
const BUTTON_HEIGHT = 44;

function getRandomPosition() {
  if (typeof window === "undefined") return { x: 200, y: 300 };
  const padding = 24;
  const x = padding + Math.random() * (window.innerWidth - BUTTON_WIDTH - padding * 2);
  const y = padding + Math.random() * (window.innerHeight - BUTTON_HEIGHT - padding * 2);
  return { x, y };
}

export default function ProposalPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saidYes, setSaidYes] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [vibe, setVibe] = useState("");
  const [whenFree, setWhenFree] = useState("");
  const [sending, setSending] = useState(false);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, partner_name, photo_url, payment_status")
        .eq("share_slug", slug)
        .single();

      if (error || !data || data.payment_status !== "paid") {
        setNotFound(true);
        setProposal(null);
      } else {
        setProposal(data as Proposal);
        setNoButtonPos(getRandomPosition());
      }
      setLoading(false);
    })();
  }, [slug]);

  const teleportNo = useCallback(() => {
    setNoButtonPos(getRandomPosition());
  }, []);

  useEffect(() => {
    if (!saidYes && proposal && noButtonRef.current) {
      const onMove = (e: MouseEvent) => {
        const btn = noButtonRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (dx * dx + dy * dy < HOVER_RADIUS * HOVER_RADIUS) {
          teleportNo();
        }
      };
      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    }
  }, [saidYes, proposal, teleportNo]);

  const handleYes = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#f472b6", "#fbbf24", "#fef3c7"],
    });
    setSaidYes(true);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal?.id) return;
    setSending(true);
    try {
      const res = await fetch("/api/send-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          date: whenFree || undefined,
          vibe: vibe || undefined,
          partnerName: proposal.partner_name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send invitation.");
        return;
      }
      setVibe("");
      setWhenFree("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-pink-200/50 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
          <p className="text-gray-600">This proposal link is invalid or not yet active.</p>
        </div>
      </div>
    );
  }

  const partnerName = proposal.partner_name || "My Love";

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex flex-col items-center justify-center p-4 py-10">
      {!saidYes ? (
        <>
          {/* Polaroid frame */}
          <div
            className="bg-white p-3 pb-8 shadow-xl rotate-[-3deg] hover:rotate-0 transition-transform duration-300"
            style={{ maxWidth: 320 }}
          >
            <div className="bg-gray-100 aspect-[4/3] overflow-hidden flex items-center justify-center">
              {proposal.photo_url ? (
                <img
                  src={proposal.photo_url}
                  alt="Us"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-pink-300 text-4xl">❤️</span>
              )}
            </div>
            <p className="text-center text-gray-700 text-lg mt-2 font-medium">Us? ❤️</p>
          </div>

          <p className={`font-pacifico text-2xl md:text-3xl text-pink-700 text-center mt-8 max-w-md`}>
            {partnerName}, will you be my Valentine?
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 relative">
            <button
              type="button"
              onClick={handleYes}
              className="px-8 py-4 text-xl font-semibold rounded-2xl bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-300/50 transition-colors"
            >
              YES! 💖
            </button>
            <button
              ref={noButtonRef}
              type="button"
              className="px-6 py-3 text-base font-medium rounded-xl bg-gray-400 hover:bg-gray-500 text-white shadow transition-colors fixed"
              style={{
                left: noButtonPos.x,
                top: noButtonPos.y,
                width: BUTTON_WIDTH,
                height: BUTTON_HEIGHT,
              }}
            >
              No 🥺
            </button>
          </div>
        </>
      ) : (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-pink-200/50 p-8">
          <p className="font-pacifico text-2xl text-pink-700 text-center mb-6">You said yes! 💕</p>
          <form onSubmit={handleSendInvitation} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">The Vibe</label>
              <input
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Cozy dinner, movie night…"
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">When are we free?</label>
              <input
                type="datetime-local"
                value={whenFree}
                onChange={(e) => setWhenFree(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending…" : "Send Invitation"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
