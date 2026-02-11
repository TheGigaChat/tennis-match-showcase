// app/messages/[chatId]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center text-center px-6">
      <div>
        <h1 className="text-h2 text-textMain font-semibold">Chat not found</h1>
        <p className="mt-2 text-h5 text-textMain/80">The chat doesn’t exist or you don’t have access.</p>
        <Link href="/messages" className="mt-4 inline-block rounded-xl bg-[var(--main)] text-white px-4 py-2">Back to messages</Link>
      </div>
    </main>
  );
}
