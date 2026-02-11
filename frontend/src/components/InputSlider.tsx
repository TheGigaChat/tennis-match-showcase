"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  ChangeEvent,
} from "react";

type InputSliderProps = {
  icon: React.ReactNode;
  title: string;
  min?: number;
  maxNumber?: number;
  /** Uncontrolled initial value (used only when `value` is not provided) */
  initial?: number;
  /** Controlled value */
  value?: number;
  /** Controlled change handler */
  onChange?: (next: number) => void;
  step?: number;
};

export default function InputSlider({
  icon,
  title,
  min = 0,
  maxNumber = 50,
  initial,
  value,
  onChange,
  step = 1,
}: InputSliderProps) {
  // clamp helper
  const clamp = (n: number) => Math.min(Math.max(n, min), maxNumber);

  const safeInitial =
    typeof initial === "number"
      ? clamp(initial)
      : Math.floor((min + maxNumber) / 2);

  // Uncontrolled internal state (used only when value/onChange not provided)
  const [inner, setInner] = useState<number>(safeInitial);

  // Are we controlled?
  const isControlled = typeof value === "number" && typeof onChange === "function";

  // The value to render
  const current = isControlled ? clamp(value as number) : inner;

  // Straight linear percentage for the active track fill
  const percentage = useMemo(() => {
    const range = maxNumber - min;
    if (range <= 0) return 0;
    return ((current - min) / range) * 100;
  }, [current, min, maxNumber]);

  const ACTIVE_HEX = "#15803d"; // green-700
  const REST_HEX = "#d1d5db";   // gray-300

  const trackStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${ACTIVE_HEX} 0%, ${ACTIVE_HEX} ${percentage}%, ${REST_HEX} ${percentage}%, ${REST_HEX} 100%)`,
    outline: "none",
    transition: "background 300ms ease-in-out",
    WebkitAppearance: "none",
  };

  // Tooltip positioning (thumb travel)
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipLeft, setTipLeft] = useState(0);

  const getThumbPosition = () => {
    const container = containerRef.current;
    if (!container) return 0;

    const trackWidth = container.offsetWidth; // actual rendered width
    const thumbPx = 24;                        // matches [&::-webkit-slider-thumb]:w-6 h-6
    const halfThumb = thumbPx / 2;

    const range = maxNumber - min;
    const t = range > 0 ? (current - min) / range : 0; // 0..1

    // Thumb center travels from 12px to (trackWidth - 12px)
    return halfThumb + t * (trackWidth - thumbPx);
  };

  const recalc = () => setTipLeft(getThumbPosition());

  useLayoutEffect(() => {
    recalc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, min, maxNumber]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver(() => recalc());
    ro.observe(containerRef.current);

    const onResize = () => recalc();
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const parsed = clamp(parseInt(e.target.value, 10));
    if (Number.isNaN(parsed)) return;

    if (isControlled) {
      (onChange as (n: number) => void)(parsed);
    } else {
      setInner(parsed);
    }
  };

  return (
    <section className="space-y-3 mb-10">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xl font-semibold text-green-900">{title}</h3>
      </div>

      {/* Container used for measuring actual track width */}
      <div ref={containerRef} className="relative h-6 flex items-center">
        {/* Tooltip */}
        <div
          className="absolute -top-10 pointer-events-none transition-[left] duration-150 ease-out"
          style={{ left: `${tipLeft}px`, transform: "translateX(-50%)" }}
          aria-hidden
        >
          <div className="relative bg-neutral-800 text-white text-xs font-bold rounded-md py-1 px-3 shadow whitespace-nowrap">
            {current}
            <span
              className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-0 h-0 
                         border-l-4 border-l-transparent border-r-4 border-r-transparent 
                         border-t-4 border-t-neutral-800"
            />
          </div>
        </div>

        {/* Slider */}
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={maxNumber}
          step={step}
          value={current}
          onChange={handleChange}
          style={trackStyle}
          className="w-full h-2 rounded-full cursor-pointer appearance-none bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-green-600
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow
            [&::-webkit-slider-thumb]:transition-colors
            [&::-webkit-slider-thumb]:hover:bg-green-700

            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:bg-green-600
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-none

            [&::-moz-range-track]:h-2"
          aria-label={title}
        />
      </div>
    </section>
  );
}
