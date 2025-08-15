import { useEffect, useRef, useState, useCallback } from "react";
import Home from "./Home";
import About from "./About";
import Project from "./Project";
import Footer from "../components/layout/footer";

const EASE_MS = 700 as const;
const WHEEL_THRESHOLD = 60 as const;
const TOUCH_THRESHOLD = 60 as const;

interface PortfolioProps {
  onIndexChange?: (i: number) => void;
  /**
   * Cho phép parent (App) đăng ký hàm goTo để Header gọi sang.
   */
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

  const total = 4; // Home, About, Project+Footer (dot cuối gom phần còn lại)

  const calcMaxScroll = (): number => {
    const el = containerRef.current;
    if (!el) return 0;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    return max;
  };

  const jumpToOffset = (nextIndex: number) => {
    const vh = window.innerHeight;
    const maxScroll = calcMaxScroll();
    const target =
      nextIndex >= total - 1 ? maxScroll : Math.min(nextIndex * vh, maxScroll);
    setOffsetPx(target);
  };

  const goTo = useCallback(
    (next: number): void => {
      if (isAnimating.current) return;
      if (next < 0 || next >= total) return;

      isAnimating.current = true;
      setIndex(next);
      onIndexChange?.(next); // thông báo ra App để Header highlight
      jumpToOffset(next);

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

  // Cho parent đăng ký hàm goTo (để Header gọi)
  useEffect(() => {
    registerGoTo?.(goTo);
  }, [goTo, registerGoTo]);

  useEffect(() => {
    // Khởi tạo đúng vị trí khi mount
    jumpToOffset(index);

    const onResize = () => {
      jumpToOffset(index);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;

      accDelta.current += e.deltaY;

      if (accDelta.current > WHEEL_THRESHOLD) {
        accDelta.current = 0;
        goTo(index + 1);
      } else if (accDelta.current < -WHEEL_THRESHOLD) {
        accDelta.current = 0;
        goTo(index - 1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (isAnimating.current) return;

      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > TOUCH_THRESHOLD) {
        goTo(index - 1);
        touchStartY.current = e.touches[0].clientY;
      } else if (dy < -TOUCH_THRESHOLD) {
        goTo(index + 1);
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const wheelOpts: AddEventListenerOptions & { passive: boolean } = {
      passive: false,
    };
    const touchOpts: AddEventListenerOptions & { passive: boolean } = {
      passive: false,
    };

    window.addEventListener("wheel", onWheel, wheelOpts);
    window.addEventListener("touchstart", onTouchStart, touchOpts);
    window.addEventListener("touchmove", onTouchMove, touchOpts);

    return () => {
      window.removeEventListener("wheel", onWheel, wheelOpts);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [index, goTo]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
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
        <section style={{ height: "100vh", width: "100vw" }}>
          <Home />
        </section>
        <section style={{ height: "100vh", width: "100vw" }}>
          <About />
        </section>
        <section style={{ minHeight: "auto" }}>
          <Project />
          <Footer />
        </section>
      </div>

      {/* Dot nav (giữ nguyên) */}
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
