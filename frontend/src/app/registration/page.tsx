// src/app/register/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ContinueButton from "@/components/ContinueButton";

// export const metadata = { title: "Register — TennisMatch" };

export default function Page() {
  const router = useRouter();

  // --- local state for email + error ---
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const isValidEmail = EMAIL_RE.test(email.trim());

  // --- API call to backend ---
  const registerUser = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Something went wrong");
      }

      const data = await res.json(); // expected: { flowId, next: "VERIFY_CODE" }

      // Check backend response
      if (data?.next === "VERIFY_CODE" && data?.flowId) {
        // Save the flowId for next step (localStorage)
        localStorage.setItem("flowId", data.flowId);

        // Redirect to verify page
        router.push("/verify");
      } else {
        throw new Error("Unexpected response from server");
      }

    } catch (err: any) {
      setEmailError(err.message || "Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = (): void => {
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      // optional: surface an error next to the field
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    registerUser(value);
  };

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto w-full max-w-phone px-6 py-8 min-h-dvh flex flex-col justify-between">
        {/* Top */}
        <header className="flex flex-col items-center pt-2">
          <Image
            src="/logo.png"
            alt="TennisMatch logo"
            width={80}
            height={80}
            className="h-20 w-20"
            priority
          />
          {/* Logo text: 36px, bold, main color */}
          <h1 className="mt-4 text-logo leading-8 font-bold text-main tracking-tight">
            TennisMatch
          </h1>
        </header>

        {/* Middle */}
        <main className="mt-6 flex flex-col">
          <h2 className="text-center text-h1 font-semibold text-textMain">
            Welcome to
            <br />
            TennisMatch!
          </h2>
          <div className="mt-6 space-y-1 text-center text-h3 leading-6 text-neutral">
            <p>Find partners</p>
            <p>&amp;</p>
            <p>play more tennis.</p>
          </div>
        </main>

        {/* Bottom */}
        <footer className="pb-[env(safe-area-inset-bottom)]">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <div
            className={[
              "mt-6 flex h-12 items-center gap-3 rounded-xl bg-white px-4 shadow-sm",
              emailError ? "border border-red-500" : "border border-neutralLight",
            ].join(" ")}
          >
            <Image src="/mail.svg" alt="" width={18} height={18} />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleContinue();
              }}
              disabled={isLoading}
              className="peer w-full bg-transparent text-h4 text-textMain placeholder:text-neutralLight outline-none"
            />
          </div>
          {emailError && (
            <p id="email-error" role="alert" className="mt-2 text-h5 text-red-600">
              {emailError}
            </p>
          )}

          <ContinueButton
            className={`mt-4 transition-colors duration-200 ${
              isValidEmail ? "bg-main text-white" : "bg-neutralLight text-neutral cursor-not-allowed"
            }`}
            onClick={handleContinue}
            disabled={!isValidEmail || isLoading}
          />

          <p className="mt-6 text-center text-h5 leading-5 text-neutral">
            By continuing, you agree to our{" "}
            <a className="underline decoration-main-light underline-offset-2" href="/terms">
              Terms
            </a>{" "}
            &amp;{" "}
            <a className="underline decoration-main-light underline-offset-2" href="/policy">
              Privacy Policy
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
