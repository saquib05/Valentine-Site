"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Upload, ArrowRight } from "lucide-react";
import { supabase, VALENTINE_PHOTOS_BUCKET } from "@/lib/supabase";

const createProposalSchema = z.object({
  partnerName: z.string().min(1, "Partner's name is required"),
  yourEmail: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  customMessage: z.string().optional(),
});

type CreateProposalForm = z.infer<typeof createProposalSchema>;

export default function CreateProposalPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProposalForm>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      partnerName: "",
      yourEmail: "",
      phone: "",
      customMessage: "",
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const onSubmit = async (data: CreateProposalForm) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(VALENTINE_PHOTOS_BUCKET)
          .upload(path, photoFile, {
            contentType: photoFile.type,
            upsert: false,
          });

        if (uploadError) {
          setSubmitError(uploadError.message || "Photo upload failed.");
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from(VALENTINE_PHOTOS_BUCKET)
          .getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("proposals")
        .insert({
          partner_name: data.partnerName,
          your_email: data.yourEmail,
          phone: data.phone,
          custom_message: data.customMessage || null,
          photo_url: photoUrl,
        })
        .select("id")
        .single();

      if (insertError) {
        setSubmitError(insertError.message || "Failed to save proposal.");
        setIsSubmitting(false);
        return;
      }

      if (inserted?.id) {
        router.push(`/payment/${inserted.id}`);
        return;
      }

      setSubmitError("No ID returned from server.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl shadow-pink-200/50 p-8 md:p-10">
          <h1 className="text-2xl font-bold text-center text-pink-600 mb-8">
            Create Proposal
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                Partner&apos;s Name <span className="text-pink-500">*</span>
              </label>
              <input
                {...register("partnerName")}
                type="text"
                placeholder="e.g. Jessica"
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                  errors.partnerName
                    ? "border-red-300 focus:border-red-500"
                    : "border-pink-200 focus:border-pink-500"
                }`}
              />
              {errors.partnerName && (
                <p className="mt-1 text-sm text-red-500">{errors.partnerName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Your Email <span className="text-pink-500">*</span>
                </label>
                <input
                  {...register("yourEmail")}
                  type="email"
                  placeholder="you@email.com"
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-pink-500 transition-colors ${
                    errors.yourEmail ? "border-red-300" : ""
                  }`}
                />
                {errors.yourEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.yourEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                  Phone <span className="text-pink-500">*</span>
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="9999999999"
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-pink-500 transition-colors ${
                    errors.phone ? "border-red-300" : ""
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                Custom Message (Optional)
              </label>
              <textarea
                {...register("customMessage")}
                placeholder="e.g. Can't wait for our dinner date! 🥂"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-pink-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                Upload Photo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[140px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-pink-300 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-pink-600"
              >
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-h-24 w-auto rounded-lg object-cover"
                    />
                    <span className="text-sm">Click to change photo</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10" strokeWidth={1.5} />
                    <span className="text-sm">Click to upload photo</span>
                  </>
                )}
              </button>
            </div>

            {submitError && (
              <p className="text-sm text-red-500 text-center">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium shadow-lg shadow-pink-200/50 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving…" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
