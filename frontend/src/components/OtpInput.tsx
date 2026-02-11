"use client";

import { useEffect, useRef, useState } from "react";

const OTP_LEN = 6;
const DIGIT_RE = /^[0-9]$/;

export default function OtpInput({
  onComplete,
  onChange,
  resetKey,     // bump this number to clear all inputs
  error = false // show red border when true
}: {
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  resetKey?: number;
  error?: boolean;
}) {
  const [code, setCode] = useState<string[]>(Array(OTP_LEN).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resetKey === undefined) return;
    // clear and focus the first box on reset
    const next = Array(OTP_LEN).fill("");
    setCode(next);
    inputsRef.current[0]?.focus();
  }, [resetKey]);

  const focusIndex = (idx: number) => {
    inputsRef.current[idx]?.focus();
    inputsRef.current[idx]?.select();
  };

  const pushUpdate = (next: string[]) => {
    setCode(next);
    const joined = next.join("");
    onChange?.(joined);
    if (joined.length === OTP_LEN && !next.includes("")) onComplete?.(joined);
  };

  const setAt = (idx: number, val: string) => {
    const next = [...code];
    next[idx] = val;
    pushUpdate(next);
  };

  const handleChange = (idx: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    if (!d) { setAt(idx, ""); return; }
    setAt(idx, d);
    if (idx < OTP_LEN - 1) focusIndex(idx + 1);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "Backspace") {
      if (code[idx]) {
        setAt(idx, "");
      } else if (idx > 0) {
        setAt(idx - 1, "");
        focusIndex(idx - 1);
      }
      e.preventDefault();
      return;
    }

    if (key === "ArrowLeft" && idx > 0) { focusIndex(idx - 1); e.preventDefault(); return; }
    if (key === "ArrowRight" && idx < OTP_LEN - 1) { focusIndex(idx + 1); e.preventDefault(); return; }

    if (key.length === 1 && DIGIT_RE.test(key)) {
      setAt(idx, key);
      if (idx < OTP_LEN - 1) focusIndex(idx + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedDigits = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!pastedDigits) return;
    const next = [...code];
    let i = idx;
    for (const ch of pastedDigits) {
      if (i >= OTP_LEN) break;
      next[i++] = ch;
    }
    pushUpdate(next);
    focusIndex(Math.min(i, OTP_LEN - 1));
  };

  const boxBase =
    "w-10 h-12 rounded-md border bg-white text-center text-h3 font-medium text-textMain outline-none transition";
  const boxBorder = error
    ? "border-red-500 focus:border-red-500"
    : "border-neutralLight focus:border-main";

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {code.map((v, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }} // must return void
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={1}
          value={v}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          className={`${boxBase} ${boxBorder}`}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
