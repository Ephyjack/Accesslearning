import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap,
  Camera,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Users,
  Hash,
  MapPin,
  Building,
  CheckCircle2,
} from "lucide-react";

const COUNTRIES = [
  "Nigeria", "Japan", "Brazil", "United States", "Germany", "India",
  "France", "China", "Ghana", "South Korea", "United Kingdom", "Canada",
  "Saudi Arabia", "Australia", "Mexico", "South Africa",
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as "teacher" | "student") || "student";

  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSteps = role === "teacher" ? 3 : 3;

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatar(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

const finish = async () => {
  try {
    // Get current logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not found. Please log in again.");
    }

    // Insert profile into database
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: searchParams.get("name") || "",
      role: role,
      country: country,
      school: school,
      id_number: role === "teacher" ? idNumber : null,
      avatar_url: avatar, // (base64 for now, later we use storage)
    });

    if (error) throw error;

    // Redirect after success
    if (role === "teacher") navigate("/teacher");
    else navigate("/student");
  } catch (err: any) {
    console.error(err.message);
    alert(err.message);
  }
};

  const canNext = () => {
    if (step === 1) return country !== "" && school !== "";
    if (step === 2 && role === "teacher") return idNumber !== "";
    return true;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #4c1d95 100%)" }}
    >
      {/* Glow blobs */}
      <div
        className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, #7c3aed, transparent 70%)",
          transform: "translate(-30%, -30%)",
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-15"
        style={{
          background: "radial-gradient(circle, #2563eb, transparent 70%)",
          transform: "translate(30%, 30%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-lg rounded-2xl p-8"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-7">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
          >
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>
            Access<span style={{ color: "#7c3aed" }}>Learn</span>
          </span>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{
                  background:
                    i + 1 < step
                      ? "linear-gradient(135deg, #1e3a8a, #7c3aed)"
                      : i + 1 === step
                      ? "linear-gradient(135deg, #1e3a8a, #7c3aed)"
                      : "#f1f5f9",
                  color: i + 1 <= step ? "white" : "#94a3b8",
                  fontWeight: 700,
                }}
              >
                {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className="flex-1 h-1 rounded-full"
                  style={{
                    background: i + 1 < step
                      ? "linear-gradient(90deg, #1e3a8a, #7c3aed)"
                      : "#f1f5f9",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: role === "teacher" ? "rgba(30,58,138,0.08)" : "rgba(124,58,237,0.08)",
              color: role === "teacher" ? "#1e3a8a" : "#7c3aed",
            }}
          >
            {role === "teacher" ? (
              <BookOpen className="w-3.5 h-3.5" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
            {role === "teacher" ? "Teacher Account" : "Student Account"}
          </div>
          <span className="text-xs text-gray-400">Step {step} of {totalSteps}</span>
        </div>

        {/* STEP 1 — Location & School */}
        {step === 1 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              Where are you from?
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Tell us a bit about your location and institution.
            </p>

            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                <MapPin className="w-4 h-4 inline mr-1.5 text-gray-400" />
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: country ? "#7c3aed" : "#e2e8f0", background: "white" }}
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                <Building className="w-4 h-4 inline mr-1.5 text-gray-400" />
                School / Institution Name
              </label>
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Lagos State University"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: school ? "#7c3aed" : "#e2e8f0" }}
              />
            </div>
          </div>
        )}

        {/* STEP 2 — Teacher ID / Role confirmation */}
        {step === 2 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              {role === "teacher" ? "Verify your identity" : "Confirm your role"}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {role === "teacher"
                ? "Enter your staff or employee ID number for verification."
                : "Review and confirm your account details."}
            </p>

            {role === "teacher" && (
              <div className="mb-4">
                <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                  <Hash className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  Staff / Employee ID Number
                </label>
                <input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. TCH-2024-00421"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: idNumber ? "#7c3aed" : "#e2e8f0" }}
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  This is used to verify your institution role. It won't be shown publicly.
                </p>
              </div>
            )}

            {/* Role confirmation card */}
            <div
              className="rounded-xl p-4 flex items-center gap-4 mt-4"
              style={{
                background: role === "teacher" ? "rgba(30,58,138,0.05)" : "rgba(124,58,237,0.05)",
                border: `1px solid ${role === "teacher" ? "rgba(30,58,138,0.2)" : "rgba(124,58,237,0.2)"}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: role === "teacher" ? "#1e3a8a" : "#7c3aed",
                }}
              >
                {role === "teacher" ? (
                  <BookOpen className="w-6 h-6 text-white" />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>
                  {role === "teacher" ? "Teacher" : "Student"}
                </div>
                <div className="text-sm text-gray-400">{school} · {country}</div>
              </div>
              <CheckCircle2
                className="w-5 h-5 ml-auto"
                style={{ color: role === "teacher" ? "#1e3a8a" : "#7c3aed" }}
              />
            </div>
          </div>
        )}

        {/* STEP 3 — Avatar upload */}
        {step === 3 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              Add a profile photo
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Help your classmates and teacher recognize you. You can skip this step.
            </p>

            <div className="flex flex-col items-center gap-5 py-4">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: avatar ? "transparent" : "linear-gradient(135deg, #1e3a8a, #7c3aed)",
                    border: "3px solid",
                    borderColor: avatar ? "#7c3aed" : "transparent",
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl" style={{ fontWeight: 700 }}>
                      {role === "teacher" ? "SM" : "YT"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: "#7c3aed" }}
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatar}
                />
              </div>

              <button
                onClick={() => fileRef.current?.click()}
                className="px-6 py-2.5 rounded-xl border text-sm transition-all hover:bg-gray-50"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}
              >
                {avatar ? "Change Photo" : "Upload Photo"}
              </button>

              <p className="text-xs text-gray-400">JPG, PNG up to 5 MB</p>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border text-sm"
              style={{ borderColor: "#e2e8f0", color: "#64748b" }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm transition-all"
              style={{
                background: canNext()
                  ? "linear-gradient(135deg, #1e3a8a, #7c3aed)"
                  : "#e2e8f0",
                color: canNext() ? "white" : "#94a3b8",
                cursor: canNext() ? "pointer" : "not-allowed",
              }}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 py-3 rounded-xl text-white text-sm"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
            >
              {avatar ? "Get Started 🎉" : "Skip & Get Started"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
