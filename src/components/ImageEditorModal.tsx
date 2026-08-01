"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Check, RotateCw, ZoomIn, Sun, Contrast, Droplet, Loader2, RefreshCw } from "lucide-react";

type Props = {
  /** the picked file to edit */
  file: File;
  /** circle = round crop guide (avatars); square = rounded-square guide */
  shape?: "circle" | "square";
  /** called with the edited image as a webp blob */
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  busy?: boolean;
};

const VIEW_MAX = 320; // preview viewport cap (px)
const OUT = 900; // exported image size (px)

/**
 * Dependency-free image editor: pan + zoom + rotate to crop, plus brightness /
 * contrast / saturation / grayscale effects. Exports a square WebP so uploads
 * stay small regardless of the 35MB source. Canvas transforms mirror the CSS
 * preview transform exactly so what you see is what gets saved.
 */
export function ImageEditorModal({ file, shape = "circle", onConfirm, onCancel, busy }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fx, setFx] = useState({ bright: 100, contrast: 100, sat: 100, gray: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Preview size adapts to the viewport so the whole editor (crop circle +
  // controls + save button) fits on short/small screens instead of clipping.
  const [view, setView] = useState(VIEW_MAX);
  useEffect(() => {
    const fit = () => {
      const w = Math.floor(window.innerWidth * 0.8);
      const h = window.innerHeight - 330; // leave room for controls + buttons
      setView(Math.max(200, Math.min(VIEW_MAX, w, h)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Load the picked file into an <img> element.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const filter = `brightness(${fx.bright}%) contrast(${fx.contrast}%) saturate(${fx.sat}%) grayscale(${fx.gray}%)`;

  // Cover-fit base size inside the preview viewport (object-cover behaviour).
  function baseSize(v: number) {
    if (!img) return { w: v, h: v };
    const s = Math.max(v / img.naturalWidth, v / img.naturalHeight);
    return { w: img.naturalWidth * s, h: img.naturalHeight * s };
  }

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onPointerUp = () => { drag.current = null; };

  const reset = () => { setZoom(1); setRot(0); setPan({ x: 0, y: 0 }); setFx({ bright: 100, contrast: 100, sat: 100, gray: 0 }); };

  const build = useCallback(() => {
    if (!img) return;
    const cv = document.createElement("canvas");
    cv.width = OUT; cv.height = OUT;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#0b0410";
    ctx.fillRect(0, 0, OUT, OUT);
    const f = OUT / view;
    const base = baseSize(view);
    ctx.filter = filter;
    // Mirror CSS `transform: translate(pan) scale(zoom) rotate(rot)` (origin center).
    ctx.translate(OUT / 2 + pan.x * f, OUT / 2 + pan.y * f);
    ctx.scale(zoom, zoom);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, (-base.w * f) / 2, (-base.h * f) / 2, base.w * f, base.h * f);
    cv.toBlob((b) => { if (b) onConfirm(b); }, "image/webp", 0.9);
  }, [img, pan, zoom, rot, filter, view, onConfirm]);

  const base = baseSize(view);

  return (
    <div className="fixed inset-0 z-[60] flex justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="card-glow relative my-auto w-full max-w-md overflow-hidden p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black">ویرایش عکس</h3>
          <button onClick={onCancel} className="btn-ghost h-8 w-8 justify-center rounded-full p-0"><X size={16} /></button>
        </div>

        {/* Crop viewport */}
        <div
          className="relative mx-auto cursor-move touch-none overflow-hidden bg-[#0b0410]"
          style={{ width: view, height: view, borderRadius: shape === "circle" ? "9999px" : "1.25rem" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              alt="ویرایش"
              draggable={false}
              style={{
                position: "absolute", left: "50%", top: "50%", width: base.w, height: base.h,
                transform: `translate(-50%,-50%) translate(${pan.x}px,${pan.y}px) scale(${zoom}) rotate(${rot}deg)`,
                filter, willChange: "transform",
              }}
            />
          )}
          <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/25" style={{ borderRadius: "inherit" }} />
        </div>

        {/* Controls */}
        <div className="mt-4 space-y-3 text-xs">
          <label className="flex items-center gap-2"><ZoomIn size={14} className="text-rose-300" /><input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-full accent-rose-400" /></label>
          <div className="flex items-center gap-2">
            <button onClick={() => setRot((r) => (r + 90) % 360)} className="btn-outline flex-1 justify-center px-2 py-1.5"><RotateCw size={14} /> چرخش</button>
            <label className="flex flex-1 items-center gap-2"><span className="w-4 text-white/40">°</span><input type="range" min={-180} max={180} value={rot} onChange={(e) => setRot(+e.target.value)} className="w-full accent-rose-400" /></label>
          </div>
          <label className="flex items-center gap-2"><Sun size={14} className="text-amber-300" /><input type="range" min={50} max={150} value={fx.bright} onChange={(e) => setFx({ ...fx, bright: +e.target.value })} className="w-full accent-rose-400" /></label>
          <label className="flex items-center gap-2"><Contrast size={14} className="text-sky-300" /><input type="range" min={50} max={150} value={fx.contrast} onChange={(e) => setFx({ ...fx, contrast: +e.target.value })} className="w-full accent-rose-400" /></label>
          <label className="flex items-center gap-2"><Droplet size={14} className="text-plum-300" /><input type="range" min={0} max={200} value={fx.sat} onChange={(e) => setFx({ ...fx, sat: +e.target.value })} className="w-full accent-rose-400" /></label>
          <label className="flex items-center gap-2"><span className="w-3.5 text-white/50">B&amp;W</span><input type="range" min={0} max={100} value={fx.gray} onChange={(e) => setFx({ ...fx, gray: +e.target.value })} className="w-full accent-rose-400" /></label>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={build} disabled={busy || !img} className="btn-rose flex-1 justify-center px-4 py-2.5 text-sm">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} ذخیره عکس
          </button>
          <button onClick={reset} className="btn-outline justify-center px-3 py-2.5 text-sm"><RefreshCw size={15} /> بازنشانی</button>
        </div>
      </div>
    </div>
  );
}
