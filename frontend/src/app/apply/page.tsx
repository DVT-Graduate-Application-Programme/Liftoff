"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle, UploadCloud, FileText } from "lucide-react";
import Link from "next/link";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  university: string;
  degree: string;
  gradYear: string;
  cv: File | null;
  transcript: File | null;
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    university: "",
    degree: "",
    gradYear: "",
    cv: null,
    transcript: null,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "cv" | "transcript") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      setError(null);
      setForm((prev) => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cv) {
      setError("CV file is required.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("CandidateName", `${form.firstName} ${form.lastName}`.trim());
      formData.append("CandidateEmail", form.email);
      formData.append("CvFile", form.cv);
      if (form.transcript) {
        formData.append("TranscriptFile", form.transcript);
      }

      const response = await fetch("/api/applications/ingest", {
        method: "POST",
        headers: {
          "Idempotency-Key": `manual-${form.email}-${Date.now()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to submit application.");
      }

      setSuccess("Your manual graduate application has been submitted and ingested successfully!");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        university: "",
        degree: "",
        gradYear: "",
        cv: null,
        transcript: null,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white pb-16">
      {/* Decorative gradient headers */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-rose-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Recruiter Hub
        </Link>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-rose-400 uppercase">DVT Careers</span>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 mt-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Developer Graduate Programme
          </h1>
          <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
            Manually create a graduate application profile and ingest their CV and Academic Transcript directly into the recruitment pipeline.
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-rose-950/10">
          {success && (
            <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold">Success</h4>
                <p className="text-sm text-emerald-400/90 mt-1">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold">Error</h4>
                <p className="text-sm text-rose-400/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Personal Details */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 mb-6">
                1. Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={form.firstName}
                    onChange={handleTextChange}
                    placeholder="e.g. John"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={form.lastName}
                    onChange={handleTextChange}
                    placeholder="e.g. Doe"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleTextChange}
                    placeholder="e.g. john.doe@example.com"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleTextChange}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Current Location / City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={form.city}
                    onChange={handleTextChange}
                    placeholder="e.g. Johannesburg, South Africa"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academics */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 mb-6">
                2. Academic Background
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    University / Institution <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="university"
                    required
                    value={form.university}
                    onChange={handleTextChange}
                    placeholder="e.g. University of the Witwatersrand"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Qualification / Degree <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="degree"
                    required
                    value={form.degree}
                    onChange={handleTextChange}
                    placeholder="e.g. BSc Computer Science"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Year of Graduation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gradYear"
                    required
                    value={form.gradYear}
                    onChange={handleTextChange}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-rose-500/80 transition-colors appearance-none"
                  >
                    <option value="">Select Year</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="Before 2022">Before 2022</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Document Attachments */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 mb-6">
                3. Required Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CV Upload */}
                <div className="flex flex-col">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Curriculum Vitae (CV) <span className="text-rose-500">*</span>
                  </span>
                  <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-rose-500/50 rounded-xl p-6 bg-slate-950/40 cursor-pointer hover:bg-slate-950/60 transition-all group">
                    <input
                      type="file"
                      accept=".pdf"
                      required={!form.cv}
                      onChange={(e) => handleFileChange(e, "cv")}
                      className="sr-only"
                    />
                    {form.cv ? (
                      <div className="text-center">
                        <FileText className="mx-auto text-rose-500 mb-2" size={32} />
                        <span className="block text-xs font-medium text-slate-300 max-w-[200px] truncate">
                          {form.cv.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1">
                          {(form.cv.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="mx-auto text-slate-600 group-hover:text-rose-400 transition-colors mb-2" size={32} />
                        <span className="block text-xs font-medium text-slate-400">
                          Upload CV (PDF)
                        </span>
                        <span className="block text-[10px] text-slate-600 mt-1">
                          Max size 10MB
                        </span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Transcript Upload */}
                <div className="flex flex-col">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Academic Transcript
                  </span>
                  <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-rose-500/50 rounded-xl p-6 bg-slate-950/40 cursor-pointer hover:bg-slate-950/60 transition-all group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, "transcript")}
                      className="sr-only"
                    />
                    {form.transcript ? (
                      <div className="text-center">
                        <FileText className="mx-auto text-rose-500 mb-2" size={32} />
                        <span className="block text-xs font-medium text-slate-300 max-w-[200px] truncate">
                          {form.transcript.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1">
                          {(form.transcript.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadCloud className="mx-auto text-slate-600 group-hover:text-rose-400 transition-colors mb-2" size={32} />
                        <span className="block text-xs font-medium text-slate-400">
                          Upload Transcript (PDF)
                        </span>
                        <span className="block text-[10px] text-slate-600 mt-1">
                          Max size 10MB
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-rose-800 disabled:to-rose-900 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-rose-950/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Ingesting Application...
                </>
              ) : (
                "Submit Manual Application"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
