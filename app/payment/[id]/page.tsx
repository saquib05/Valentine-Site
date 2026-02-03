"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, Loader2 } from "lucide-react";

type Proposal = {
  id: string;
  partner_name: string | null;
  your_email: string | null;
  phone: string | null;
  custom_message: string | null;
  photo_url: string | null;
};

const DEV_MODE = process.env.NODE_ENV === "development";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<"valentine" | "lifetime" | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("proposals")
        .select("id, partner_name, your_email, phone, custom_message, photo_url")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message || "Proposal not found.");
        setProposal(null);
      } else {
        setProposal(data as Proposal);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSimulatePayment = async (plan: "valentine" | "lifetime") => {
    if (!id || !DEV_MODE) return;
    setProcessingPlan(plan);

    // Show "Processing..." for 2 seconds
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const res = await fetch("/api/dev-verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: id }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Verification failed.");
        setProcessingPlan(null);
        return;
      }
      if (json.share_slug) {
        router.push(`/v/${json.share_slug}`);
        return;
      }
      setError("No share link returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-pink-200/50 p-8 max-w-md w-full text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.push("/create")}
            className="mt-4 text-pink-600 hover:underline"
          >
            Back to Create
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-pink-200/50 p-8 md:p-10">
          <h1 className="text-2xl font-bold text-center text-pink-600 mb-2">
            Choose your link
          </h1>
          {proposal?.partner_name && (
            <p className="text-center text-gray-600 mb-8">
              For <span className="font-medium text-pink-600">{proposal.partner_name}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Valentine Link ₹50 */}
            <div className="rounded-2xl border-2 border-pink-200 bg-pink-50/50 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-pink-500" fill="currentColor" />
                <h2 className="text-lg font-semibold text-gray-800">Valentine Link</h2>
              </div>
              <p className="text-2xl font-bold text-pink-600 mb-4">₹50</p>
              <p className="text-sm text-gray-600 mb-6 flex-1">
                Share your proposal with a special Valentine link.
              </p>
              {DEV_MODE ? (
                <button
                  onClick={() => handleSimulatePayment("valentine")}
                  disabled={!!processingPlan}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {processingPlan === "valentine" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Simulate Payment (Dev Mode)"
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-gray-300 text-gray-500 font-medium cursor-not-allowed"
                >
                  Pay with Razorpay (coming soon)
                </button>
              )}
            </div>

            {/* Lifetime Link ₹80 */}
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
                <h2 className="text-lg font-semibold text-gray-800">Lifetime Link</h2>
              </div>
              <p className="text-2xl font-bold text-rose-600 mb-4">₹80</p>
              <p className="text-sm text-gray-600 mb-6 flex-1">
                Keep your proposal link forever—no expiry.
              </p>
              {DEV_MODE ? (
                <button
                  onClick={() => handleSimulatePayment("lifetime")}
                  disabled={!!processingPlan}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {processingPlan === "lifetime" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Simulate Payment (Dev Mode)"
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-gray-300 text-gray-500 font-medium cursor-not-allowed"
                >
                  Pay with Razorpay (coming soon)
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="mt-6 text-sm text-red-500 text-center">{error}</p>
          )}

          {DEV_MODE && (
            <p className="mt-6 text-xs text-amber-700 text-center bg-amber-100 rounded-lg py-2 px-3">
              Dev mode: payments are simulated. No real charges.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
