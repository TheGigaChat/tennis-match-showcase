"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export default function ChatFooter({
  onSend,
  disabled,
  placeholder = "Type a message",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSend() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-b-3xl bg-[var(--main)] px-3 py-6">
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={placeholder}
          disabled={!!disabled}
          ref={inputRef}
          className={[
            "flex-1 rounded-full bg-bg px-4 py-[10px]",
            "text-[16px] text-[var(--textMain)] placeholder:text-neutral",
            "focus:outline-none",
          ].join(" ")}
        />
        <button
          onClick={handleSend}
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          disabled={!!disabled}
          aria-label="Send"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/30 hover:bg-white/20 disabled:opacity-50"
        >
          <Image src="/send-button.svg" alt="" width={40} height={40} />
        </button>
      </div>
    </div>
  );
}
