import { useEffect, useRef, useState, useCallback } from "react";
import Home from "./Home";
import About from "./About";
import Project from "./Project";
import Footer from "../components/layout/footer";
import Resume from "./Resume";

const EASE_MS = 700 as const;
const WHEEL_THRESHOLD = 60 as const;
const TOUCH_THRESHOLD = 60 as const;

interface PortfolioProps {
  onIndexChange?: (i: number) => void;
  registerGoTo?: (fn: (i: number) => void) => void;
}

export default function Portfolio({
  onIndexChange,
  registerGoTo,
}: PortfolioProps) {
  const [index, setIndex] = useState<number>(0);
  const [offsetPx, setOffsetPx] = useState<number>(0);

  const isAnimating = useRef<boolean>(false);
  const accDelta = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionsRef = useRef<Array<HTMLElement | null>>([]);

  const total = 4;

  // --- Utils ---
  const vh = () => window.innerHeight;

  const getSectionEl = (i: number): HTMLElement | null => {
    const container = containerRef.current;
    if (!container) return null;
    const kids = Array.from(
      container.querySelectorAll(":scope > section")
    ) as HTMLElement[];
    sectionsRef.current = kids;
    return kids[i] ?? null;
  };

  const isScrollable = (el: HTMLElement | null) => {
    if (!el) return false;
    return el.scrollHeight > el.clientHeight + 1;
  };

  const atTop = (el: HTMLElement | null) => {
    if (!el) return true;
    return el.scrollTop <= 0;
  };

  const atBottom = (el: HTMLElement | null) => {
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  };

  const jumpToOffset = (nextIndex: number) => {
    const target = Math.max(0, Math.min(nextIndex * vh(), (total - 1) * vh()));
    setOffsetPx(target);
  };

  const resetScrollOf = (i: number) => {
    const el = getSectionEl(i);
    if (el) el.scrollTop = 0;
  };

  const goTo = useCallback(
    (next: number): void => {
      if (isAnimating.current) return;
      if (next < 0 || next >= total) return;

      isAnimating.current = true;
      setIndex(next);
      onIndexChange?.(next);
      jumpToOffset(next);
      resetScrollOf(next);

      const el = containerRef.current;
      const onEnd = () => {
        isAnimating.current = false;
        el?.removeEventListener("transitionend", onEnd);
      };
      el?.addEventListener("transitionend", onEnd);

      window.setTimeout(() => {
        isAnimating.current = false;
        el?.removeEventListener("transitionend", onEnd);
      }, EASE_MS + 80);
    },
    [onIndexChange]
  );

  useEffect(() => {
    registerGoTo?.(goTo);
  }, [goTo, registerGoTo]);

  useEffect(() => {
    jumpToOffset(index);
    const onResize = () => jumpToOffset(index);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel/Touch logic "section-aware"
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const active = getSectionEl(index);
      const canScroll = isScrollable(active);

      // Hướng cuộn
      const goingDown = e.deltaY > 0;
      const canGoPrev = index > 0;
      const canGoNext = index < total - 1;

      if (canScroll) {
        if (goingDown) {
          // đang trong section scrollable & chưa tới đáy -> để native scroll
          if (!atBottom(active)) return;

          // ở đáy rồi và tiếp tục kéo xuống -> chuyển màn
          if (!canGoNext) return;
          e.preventDefault();
          accDelta.current += e.deltaY;
          if (accDelta.current > WHEEL_THRESHOLD) {
            accDelta.current = 0;
            goTo(index + 1);
          }
        } else {
          // kéo lên
          if (!atTop(active)) return;

          if (!canGoPrev) return;
          e.preventDefault();
          accDelta.current += e.deltaY;
          if (accDelta.current < -WHEEL_THRESHOLD) {
            accDelta.current = 0;
            goTo(index - 1);
          }
        }
      } else {
        // section không scrollable -> fullpage như cũ
        e.preventDefault();
        if (isAnimating.current) return;

        accDelta.current += e.deltaY;
        if (accDelta.current > WHEEL_THRESHOLD && canGoNext) {
          accDelta.current = 0;
          goTo(index + 1);
        } else if (accDelta.current < -WHEEL_THRESHOLD && canGoPrev) {
          accDelta.current = 0;
          goTo(index - 1);
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - touchStartY.current;
      const active = getSectionEl(index);
      const canScroll = isScrollable(active);

      const goingDown = dy < 0;
      const canGoPrev = index > 0;
      const canGoNext = index < total - 1;

      if (canScroll) {
        if (goingDown) {
          if (!atBottom(active)) return;
          if (!canGoNext) return;
          e.preventDefault();
          if (Math.abs(dy) > TOUCH_THRESHOLD) {
            goTo(index + 1);
            touchStartY.current = e.touches[0].clientY;
          }
        } else {
          if (!atTop(active)) return;
          if (!canGoPrev) return;
          e.preventDefault();
          if (Math.abs(dy) > TOUCH_THRESHOLD) {
            goTo(index - 1);
            touchStartY.current = e.touches[0].clientY;
          }
        }
      } else {
        // Không scrollable -> fullpage
        e.preventDefault();
        if (isAnimating.current) return;
        if (dy < -TOUCH_THRESHOLD && canGoNext) {
          goTo(index + 1);
          touchStartY.current = e.touches[0].clientY;
        } else if (dy > TOUCH_THRESHOLD && canGoPrev) {
          goTo(index - 1);
          touchStartY.current = e.touches[0].clientY;
        }
      }
    };

    const opts: AddEventListenerOptions & { passive: boolean } = {
      passive: false,
    };
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchmove", onTouchMove, opts);
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [index, goTo, total]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden", // giữ nguyên, chúng ta cuộn bên trong từng section
        position: "relative",
        background: "var(--bg, #0b0b0b)",
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: "100%",
          width: "100%",
          transform: `translateY(-${offsetPx}px)`,
          transition: `transform ${EASE_MS}ms cubic-bezier(0.55, 0.055, 0.675, 0.19)`,
          willChange: "transform",
        }}
      >
        {/* Mỗi SECTION: maxHeight=100vh + overflowY:auto để cuộn nội dung dài */}
        <section style={{ maxHeight: "100vh", overflowY: "auto" }}>
          <Home onGoTo={goTo} />
        </section>

        <section style={{ maxHeight: "100vh", overflowY: "auto" }}>
          <About />
        </section>

        <section style={{ maxHeight: "100vh", overflowY: "auto" }}>
          <Project />
        </section>

        <section style={{ maxHeight: "100vh", overflowY: "auto" }}>
          <Resume />
          <Footer />
        </section>
      </div>

      {/* Dot nav */}
      <div
        style={{
          position: "fixed",
          right: 16,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 20,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "none",
              opacity: index === i ? 1 : 0.4,
              background: "#fff",
              cursor: "pointer",
            }}
            aria-label={`Go to section ${i + 1}`}
            title={`Section ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
