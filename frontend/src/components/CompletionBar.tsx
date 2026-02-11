type SegmentedProps = {
  total: number;      // e.g., 5
  current: number;    // 1-based index; e.g., 2 for page 2/5
  className?: string;
  "aria-label"?: string;
};

/** Segmented progress with smooth capsule ends. */
export default function CompletionBar({ total, current, className = "", ...a11y }: SegmentedProps) {
  const now = Math.max(0, Math.min(current, total));
  const segments = Array.from({ length: total });

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={now}
      className={`w-full ${className}`}
      {...a11y}
    >
      {/* Track with rounded ends; overflow hides inner segment edges */}
      <div className="h-1.5 w-full rounded-full bg-neutralLight overflow-hidden">
        <div className="flex h-full w-full">
          {segments.map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i < now ? "bg-main" : "bg-transparent"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
