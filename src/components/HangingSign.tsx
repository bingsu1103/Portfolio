import React, { useEffect, useState } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";

/**
 * HangingSign
 * - Shows a hanging sign that drops in on first render, stays briefly, then gets pulled up and disappears.
 * - Built with React + TypeScript + TailwindCSS + Framer Motion
 */
export default function HangingSign({
  text = "Hello world",
  dropDistance = 60, // how far the sign drops from the top (px)
  holdMs = 8000, // how long the sign stays before retracting (ms)
  enterDuration = 0.9, // seconds
  exitDuration = 0.6, // seconds
  ropeOffset = 10, // extra rope length from anchor to sign ring (px)
}: {
  text?: string;
  dropDistance?: number;
  holdMs?: number;
  enterDuration?: number;
  exitDuration?: number;
  ropeOffset?: number;
}) {
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(true);

  // Motion value for Y so we can visually "connect" the rope height
  const y = useMotionValue(-200);
  const ropeHeight = useTransform(y, (latest) =>
    Math.max(0, latest + ropeOffset)
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Drop in
      await controls.start({
        y: dropDistance,
        rotate: [0, 6, -3, 2, 0], // a little wobble
        transition: {
          y: {
            type: "spring",
            stiffness: 200,
            damping: 18,
            duration: enterDuration,
          },
          rotate: { duration: enterDuration, ease: "easeOut" },
        },
      });

      if (cancelled) return;

      // Hold
      await new Promise((r) => setTimeout(r, holdMs));

      if (cancelled) return;

      // Retract up & fade
      await controls.start({
        y: -220,
        opacity: 0,
        rotate: [0, -4, 2, 0],
        transition: {
          y: { duration: exitDuration, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: exitDuration * 0.8 },
          rotate: { duration: exitDuration },
        },
      });

      if (!cancelled) setIsVisible(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [controls, dropDistance, holdMs, enterDuration, exitDuration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {/* Center top anchor */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-full">
        {/* Rope */}
        <motion.div
          style={{ height: ropeHeight as unknown as number }}
          className="w-[2px] bg-neutral-700/70 mx-auto"
        />

        {/* Small top hook / mount */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-neutral-800/70 rounded" />
      </div>

      {/* Hanging sign */}
      <motion.div
        style={{ y }}
        animate={controls}
        initial={{ y: -200, opacity: 1 }}
        className="absolute left-1/2 -translate-x-1/2 top-0"
      >
        {/* Ring */}
        <div className="mx-auto w-8 h-8 rounded-full border-2 border-neutral-700 bg-neutral-100 shadow-sm flex items-center justify-center">
          <div className="w-1 h-2 bg-neutral-700 rounded" />
        </div>

        {/* The sign board */}
        <div className="mt-2 bg-white/95 backdrop-blur shadow-xl rounded-2xl border border-neutral-200 px-8 py-4">
          <div className="text-2xl font-semibold tracking-tight text-neutral-900 select-none">
            {text}
          </div>
          <div className="text-xs text-neutral-500 text-center mt-1">
            welcome · xin chào · こんにちは · hola
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/*
Usage:
1) Ensure Tailwind and Framer Motion are installed and configured in your project.
   npm i framer-motion

2) Place <HangingSign /> near the root of your app (e.g., in App.tsx or layout.tsx).

3) Optional props:
   <HangingSign text="Hello world" dropDistance={160} holdMs={2000} />

4) Adjust rope length explicitly via `ropeOffset`:
   <HangingSign ropeOffset={100} /> // Longer rope
   <HangingSign ropeOffset={0} />   // Shorter rope
*/
