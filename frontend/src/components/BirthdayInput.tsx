"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BirthdateValue = { year: string; month: string; day: string; iso: string | null };

export default function BirthdateSlots({
  initialISO = null,
  error = false,
  resetKey,
  onChange,
  onComplete,
}: {
  initialISO?: string | null;
  error?: boolean;
  resetKey?: number;
  onChange?: (v: BirthdateValue) => void;
  onComplete?: (iso: string) => void;
}) {
  // per-slot values
  const [yy, setYY] = useState<string[]>(["", "", "", ""]);
  const [mm, setMM] = useState<string[]>(["", ""]);
  const [dd, setDD] = useState<string[]>(["", ""]);

  const yRef = useRef<(HTMLInputElement | null)[]>([]);
  const mRef = useRef<(HTMLInputElement | null)[]>([]);
  const dRef = useRef<(HTMLInputElement | null)[]>([]);

  // --- derive ISO + notify ---
  const clamp2 = (n: number) => String(n).padStart(2, "0").slice(-2);
  const iso = useMemo(() => {
    const y = yy.join(""), m = mm.join(""), d = dd.join("");
    if (y.length !== 4 || m.length !== 2 || d.length !== 2) return null;
    const Y = +y, M = +m, D = +d;
    if (Y < 1900 || M < 1 || M > 12) return null;
    const last = new Date(Y, M, 0).getDate();
    if (D < 1 || D > last) return null;
    const dt = new Date(`${y}-${clamp2(M)}-${clamp2(D)}T00:00:00Z`);
    if (dt.getTime() > Date.now()) return null;
    return `${y}-${clamp2(M)}-${clamp2(D)}`;
  }, [yy, mm, dd]);

  useEffect(() => {
    const v: BirthdateValue = { year: yy.join(""), month: mm.join(""), day: dd.join(""), iso };
    onChange?.(v);
    if (iso) onComplete?.(iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yy, mm, dd, iso]);

  // --- prefill/reset ---
  useEffect(() => {
    if (!initialISO) return;
    const s = initialISO.replace(/\D/g, "");
    if (s.length >= 8) {
      setYY(s.slice(0, 4).split(""));
      setMM(s.slice(4, 6).split(""));
      setDD(s.slice(6, 8).split(""));
    }
  }, [initialISO]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setYY(["", "", "", ""]); setMM(["", ""]); setDD(["", ""]);
    yRef.current[0]?.focus();
  }, [resetKey]);

  // --- handlers (auto-advance + smart backspace + paste) ---
  const setSlot = (group: "y" | "m" | "d", idx: number, val: string) => {
    const clean = (val.replace(/\D/g, "") || "").slice(-1);
    const update = (arr: string[], setArr: (a: string[]) => void) => {
      const copy = [...arr]; copy[idx] = clean; setArr(copy);
    };
    if (group === "y") update(yy, setYY);
    if (group === "m") update(mm, setMM);
    if (group === "d") update(dd, setDD);
  };

  const focusNext = (group: "y" | "m" | "d", idx: number) => {
    if (group === "y") {
      if (idx < 3) yRef.current[idx + 1]?.focus();
      else mRef.current[0]?.focus();
    } else if (group === "m") {
      if (idx < 1) mRef.current[idx + 1]?.focus();
      else dRef.current[0]?.focus();
    } else {
      if (idx < 1) dRef.current[idx + 1]?.focus();
    }
  };

  const focusPrev = (group: "y" | "m" | "d", idx: number) => {
    if (group === "y") { if (idx > 0) yRef.current[idx - 1]?.focus(); }
    if (group === "m") { if (idx === 0) yRef.current[3]?.focus(); else mRef.current[idx - 1]?.focus(); }
    if (group === "d") { if (idx === 0) mRef.current[1]?.focus(); else dRef.current[idx - 1]?.focus(); }
  };

  const onKeyDown = (group: "y" | "m" | "d", idx: number) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const key = e.key;
      if (key === "Backspace") {
        // delete current or jump back and delete
        const arr = group === "y" ? yy : group === "m" ? mm : dd;
        if (arr[idx]) setSlot(group, idx, "");
        else { focusPrev(group, idx); const j = Math.max(idx - 1, 0); setTimeout(() => setSlot(group, j, ""), 0); }
        e.preventDefault();
        return;
      }
      if (key === "ArrowLeft") { focusPrev(group, idx); e.preventDefault(); return; }
      if (key === "ArrowRight") { focusNext(group, idx); e.preventDefault(); return; }
      if (key.length === 1 && /\d/.test(key)) { setSlot(group, idx, key); focusNext(group, idx); e.preventDefault(); }
    };

  const onChangeSlot = (group: "y" | "m" | "d", idx: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlot(group, idx, e.target.value);
      if (/\d/.test(e.target.value.slice(-1))) focusNext(group, idx);
    };

  const onPaste = (group: "y" | "m" | "d", idx: number) =>
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      let s = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
      if (!s) return;
      const fill = (arr: string[], start: number) => {
        const copy = [...arr]; let i = start;
        while (i < copy.length && s) { copy[i++] = s[0]; s = s.slice(1); }
        return copy;
      };
      let Y = yy, M = mm, D = dd;
      if (group === "y") { Y = fill(Y, idx); M = fill(M, 0); D = fill(D, 0); }
      if (group === "m") { M = fill(M, idx); D = fill(D, 0); }
      if (group === "d") { D = fill(D, idx); }
      setYY(Y); setMM(M); setDD(D);
      if (s.length === 0) {
        if (D.every(Boolean)) dRef.current[1]?.focus();
        else if (M.every(Boolean)) dRef.current[0]?.focus();
        else if (Y.every(Boolean)) mRef.current[0]?.focus();
      }
    };

  // --- styles: underline-only slots + spacing (unchanged) ---
  const slot =
    "w-6 h-10 sm:w-6 sm:h-12 text-center bg-transparent outline-none " +
    "border-0 border-b-2 text-h3 text-textMain caret-textMain " +
    (error ? "border-red-500 focus:border-red-500"
           : "border-neutralLight focus:border-main");
  const groupGap = "flex items-end gap-2";        // spacing inside a group
  const allGroupsGap = "flex items-center justify-center gap-2"; // spacing between groups

  // group-empty flags (used to hide placeholders for the whole group once any digit is typed)
  const yearEmpty  = yy.every((x) => !x);
  const monthEmpty = mm.every((x) => !x);
  const dayEmpty   = dd.every((x) => !x);

  return (
    <div className="mt-6">
      <div className={allGroupsGap}>
        {/* YEAR group */}
        <div className={groupGap}>
          {yy.map((v, i) => (
            <input
              key={`y-${i}`}
              ref={(el) => { yRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d*"
              maxLength={1}
              value={v}
              placeholder={yearEmpty ? "Y" : ""}
              onChange={onChangeSlot("y", i)}
              onKeyDown={onKeyDown("y", i)}
              onPaste={onPaste("y", i)}
              className={slot + " placeholder:text-neutral"}
              aria-label={`Year digit ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-h3 text-neutral select-none">/</span>

        {/* MONTH group */}
        <div className={groupGap}>
          {mm.map((v, i) => (
            <input
              key={`m-${i}`}
              ref={(el) => { mRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d*"
              maxLength={1}
              value={v}
              placeholder={monthEmpty ? "M" : ""}
              onChange={onChangeSlot("m", i)}
              onKeyDown={onKeyDown("m", i)}
              onPaste={onPaste("m", i)}
              className={slot + " placeholder:text-neutral"}
              aria-label={`Month digit ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-h3 text-neutral select-none">/</span>

        {/* DAY group */}
        <div className={groupGap}>
          {dd.map((v, i) => (
            <input
              key={`d-${i}`}
              ref={(el) => { dRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d*"
              maxLength={1}
              value={v}
              placeholder={dayEmpty ? "D" : ""}
              onChange={onChangeSlot("d", i)}
              onKeyDown={onKeyDown("d", i)}
              onPaste={onPaste("d", i)}
              className={slot + " placeholder:text-neutral"}
              aria-label={`Day digit ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
