"use client";

// src/app/verify/page.tsx
import Image from "next/image";
import ContinueButton from "@/components/ContinueButton";
import OtpInput from "@/components/OtpInput";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// (omit metadata on a client page)

export default function Page() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [flowId, setFlowId] = useState<string | null>(null);

  // read flowId saved during /auth/register
  useEffect(() => {
    const f = typeof window !== "undefined" ? localStorage.getItem("flowId") : null;
    setFlowId(f);
  }, []);

  const resetOtp = () => {
    setResetKey((k) => k + 1); // clears OTP boxes
    setCode("");               // keep our flag in sync
  };

  const verifyCode = async (val: string) => {
    if (!flowId) {
      setError("Verification flow expired. Please start again.");
      resetOtp();
      return;
    }
    if (val.length !== 6) return;

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send/receive cookies
        body: JSON.stringify({ flowId, code: val }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || "Invalid code");
      }

      const data = await res.json(); // expected: { next: "GO_TO_PROFILE" | "COMPLETE_PROFILE" }
      // server should have set the session cookie via Set-Cookie

      if (data?.next === "GO_TO_PROFILE") {
        router.push("/profile");
      } else if (data?.next === "COMPLETE_PROFILE") {
        router.push("/name");
      } else {
        throw new Error("Unexpected server response");
      }
    } catch (err: any) {
      setError(err.message || "Code is incorrect. Try again.");
      resetOtp();
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (!flowId) return;
    try {
      setIsLoading(true);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ flowId }),
      });
      // optional: show a “sent” toast/notice
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-phone px-6 py-8 min-h-dvh flex flex-col justify-between">
        {/* Top */}
        <header className="flex flex-col items-center pt-2">
          <Image src="/logo.png" alt="TennisMatch logo" width={80} height={80} className="h-20 w-20" priority />
          <h1 className="mt-4 text-logo font-bold text-main tracking-tight">TennisMatch</h1>
        </header>

        {/* Middle */}
        <main className="mt-6 flex flex-col items-center">
          <h2 className="text-h1 font-semibold text-textMain text-center">Verify your email</h2>
          <p className="mt-2 text-h4 text-neutral text-center">
            We’ve sent a 6-digit code to your email.
          </p>

          <OtpInput
            resetKey={resetKey}
            error={!!error}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            onComplete={(v) => {
              // auto-submit once user finishes 6 digits
              if (v.length === 6) verifyCode(v);
            }}
          />

          {error && (
            <p className="mt-3 text-h5 text-red-600">{error}</p>
          )}
        </main>

        {/* Bottom */}
        <footer className="mt-6 pb-[env(safe-area-inset-bottom)]">
          <ContinueButton
            label="Resend"
            className="mb-4"
            onClick={resendCode}
            disabled={isLoading || !flowId}
          />
          <ContinueButton
            label={isLoading ? "Verifying..." : "Continue"}
            onClick={() => verifyCode(code)}
            disabled={isLoading || code.length !== 6 || !flowId}
            className={`transition-colors duration-200 ${
              code.length === 6 ? "bg-main text-white" : "bg-neutralLight text-neutral cursor-not-allowed"
            }`}
          />
        </footer>
      </div>
    </div>
  );
}
