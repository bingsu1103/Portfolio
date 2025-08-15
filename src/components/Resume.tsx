import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  RenderingCancelledException,
} from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";
// Vite: lấy URL worker dạng module
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "./ui/button";

GlobalWorkerOptions.workerSrc = workerSrc;

// ---- constants -------------------------------------------------------------
const ENG_PATH = "/info/ENG_CV.pdf";
const VIE_PATH = "/info/VIE_CV.pdf";

// ===========================================================================
// Resume component: Hiển thị 1 trang PDF, có nút chuyển ENG/VIE
// Có hiệu ứng "lật trang" (flip) khi đổi ngôn ngữ
// ===========================================================================

type Props = {
  defaultLang?: "ENG" | "VIE";
  pageNumber?: number; // mặc định 1
  maxWidthPx?: number; // giới hạn bề ngang "tờ giấy"
};

export default function Resume({
  defaultLang = "ENG",
  pageNumber = 1,
  maxWidthPx = 1100,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pdfRef = useRef<any>(null);
  const pageRef = useRef<PDFPageProxy | null>(null);

  const renderTaskRef = useRef<any>(null);
  const lastWidthRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const debounceIdRef = useRef<number | null>(null);
  const renderTokenRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<"ENG" | "VIE">(defaultLang);
  const [isFlipping, setIsFlipping] = useState(false);

  const fileUrl = lang === "ENG" ? ENG_PATH : VIE_PATH;

  // ---- helpers -------------------------------------------------------------
  const cancelOngoingRender = () => {
    try {
      renderTaskRef.current?.cancel();
    } catch {}
    renderTaskRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (debounceIdRef.current) {
      window.clearTimeout(debounceIdRef.current);
      debounceIdRef.current = null;
    }
  };

  const scheduleRender = (delay = 120) => {
    if (debounceIdRef.current) window.clearTimeout(debounceIdRef.current);
    debounceIdRef.current = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        void renderOnce();
      });
    }, delay);
  };

  // ---- load PDF + page -----------------------------------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      cancelOngoingRender();
      pageRef.current = null;
      lastWidthRef.current = 0;
      setReady(false);

      const doc = await getDocument(fileUrl).promise;
      if (!alive) {
        try {
          doc.destroy();
        } catch {}
        return;
      }
      pdfRef.current = doc;

      const page = await doc.getPage(pageNumber);
      if (!alive) {
        try {
          doc.destroy();
        } catch {}
        return;
      }
      pageRef.current = page;

      setReady(true);
      scheduleRender(60);
    })().catch(console.error);

    return () => {
      alive = false;
      cancelOngoingRender();
      try {
        pdfRef.current?.destroy();
      } catch {}
      pdfRef.current = null;
      pageRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, pageNumber]);

  // ---- render atomic vào offscreen rồi blit sang visible -------------------
  const renderOnce = async () => {
    const page = pageRef.current;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!page || !wrap || !canvas) return;

    const availW = Math.max(320, Math.min(wrap.clientWidth - 32, maxWidthPx));
    if (availW <= 0) return;

    // Chỉ render khi width thực sự đổi
    if (Math.abs(availW - lastWidthRef.current) < 1) return;
    lastWidthRef.current = availW;

    // Chuẩn hoá rotation để portrait (tránh 180/270)
    let baseRot = (((page.rotate ?? 0) % 360) + 360) % 360;
    if (baseRot === 180) baseRot = 0;
    if (baseRot === 270) baseRot = 90;

    // Tính viewport theo width container
    const probe = page.getViewport({ scale: 1, rotation: baseRot });
    const scale = availW / probe.width;
    const viewport = page.getViewport({ scale, rotation: baseRot });

    const dpr = window.devicePixelRatio || 1;
    const outW = Math.floor(viewport.width * dpr);
    const outH = Math.floor(viewport.height * dpr);

    // Hủy render cũ trước khi đổi kích thước
    cancelOngoingRender();

    // Canvas hiển thị
    const visCtx = canvas.getContext("2d")!;
    visCtx.setTransform(1, 0, 0, 1, 0, 0);
    visCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = outW;
    canvas.height = outH;
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    // Offscreen buffer (đảm bảo atomic)
    const buffer = document.createElement("canvas");
    buffer.width = outW;
    buffer.height = outH;
    const bufCtx = buffer.getContext("2d")!;
    bufCtx.fillStyle = "#fff"; // nền trắng, không lộ lớp dưới
    bufCtx.fillRect(0, 0, outW, outH);
    bufCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const myToken = ++renderTokenRef.current;
    try {
      const task = page.render({
        canvasContext: bufCtx,
        viewport,
        intent: "display",
      });
      renderTaskRef.current = task;
      await task.promise;
      if (renderTokenRef.current !== myToken) return; // có render mới bắt đầu trong khi chờ
    } catch (err) {
      if (!(err instanceof RenderingCancelledException))
        console.error("PDF render error:", err);
      return;
    } finally {
      if (renderTokenRef.current === myToken) renderTaskRef.current = null;
    }

    // Blit duy nhất một lần sau khi render hoàn tất
    visCtx.setTransform(1, 0, 0, 1, 0, 0);
    visCtx.drawImage(buffer, 0, 0);
  };

  // ---- observe thay đổi kích thước container ------------------------------
  useEffect(() => {
    if (!ready) return;
    const ro = new ResizeObserver(() => scheduleRender());
    if (wrapRef.current) ro.observe(wrapRef.current);
    scheduleRender(0);
    return () => {
      ro.disconnect();
      cancelOngoingRender();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ---- UI ------------------------------------------------------------------
  const onSwitch = (target: "ENG" | "VIE") => {
    if (target === lang) return;
    setIsFlipping(true);
    // kết thúc flip sau 450ms để đồng bộ với CSS transition
    window.setTimeout(() => setIsFlipping(false), 450);
    setLang(target);
  };

  return (
    <section className="w-full bg-background py-10">
      <div className="mx-auto max-w-[1100px] px-4 relative isolate z-10">
        {/* Toolbar chuyển ngôn ngữ */}
        <div className="sticky top-4 z-20 mb-4 flex w-full justify-center">
          <div className="inline-flex rounded-2xl border bg-background shadow-md overflow-hidden">
            <Button
              type="button"
              variant={lang === "ENG" ? "default" : "outline"}
              onClick={() => onSwitch("ENG")}
              aria-pressed={lang === "ENG"}
              style={{
                borderTopRightRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
            >
              English CV
            </Button>
            <Button
              type="button"
              variant={lang === "VIE" ? "default" : "outline"}
              onClick={() => onSwitch("VIE")}
              aria-pressed={lang === "VIE"}
              style={{
                borderTopLeftRadius: "0px",
                borderBottomLeftRadius: "0px",
              }}
            >
              CV Tiếng Việt
            </Button>
          </div>
        </div>

        {/* Khung hiển thị có hiệu ứng lật */}
        <div ref={wrapRef} className={`relative isolate z-10 mx-auto px-4`}>
          <div
            className={`bg-white rounded-xl flex justify-center shadow-2xl border p-4 will-change-transform`}
            style={{
              perspective: 1200,
              transformStyle: "preserve-3d",
              transition: "transform 420ms ease",
              transform: isFlipping ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <canvas
              ref={canvasRef}
              className="block mx-auto"
              style={{
                borderRadius: 12,
                background: "#fff",
                mixBlendMode: "normal",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
