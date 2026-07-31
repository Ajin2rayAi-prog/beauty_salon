"use client";

import { useRef, useState } from "react";
import { Upload, Link2, Loader2, ImageIcon, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { ImageEditorModal } from "@/components/ImageEditorModal";

type Props = {
  value: string;
  onChange: (url: string) => void;
  /** round for portraits/avatars, square for covers */
  shape?: "circle" | "square";
  label?: string;
};

/**
 * Reusable photo picker: upload a file from the device (with an in-app crop /
 * effects editor) OR paste an image URL. Uploads go to /api/admin/upload
 * (persistent Railway volume) and the returned URL is written back through
 * onChange, same as a pasted link. Clearing removes the photo.
 */
export function PhotoField({ value, onChange, shape = "circle", label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 35 * 1024 * 1024) {
      toast.error("حجم تصویر باید کمتر از ۳۵ مگابایت باشد");
      return;
    }
    setEditFile(file); // open the editor
  }

  async function uploadBlob(blob: Blob) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.webp", { type: "image/webp" }));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در آپلود");
      onChange(data.url);
      setEditFile(null);
      toast.success("تصویر آپلود شد");
    } catch (err: any) {
      toast.error(err.message || "خطا در آپلود");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="mt-1.5 flex items-center gap-3">
        <div
          className={`relative h-16 w-16 shrink-0 overflow-hidden border-2 border-white/15 bg-white/5 ${
            shape === "circle" ? "rounded-full" : "rounded-xl"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="پیش‌نمایش" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-white/25">
              <ImageIcon size={20} />
            </span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-outline flex-1 justify-center px-3 py-2 text-xs"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} آپلود و ویرایش عکس
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="btn-ghost justify-center px-3 py-2 text-xs text-rose-300 hover:text-rose-200"
                title="حذف عکس"
              >
                <Trash2 size={14} /> حذف
              </button>
            )}
          </div>
          <div className="relative">
            <Link2 size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              dir="ltr"
              placeholder="یا لینک تصویر https://..."
              className="input w-full py-2 pr-8 text-xs"
            />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
      </div>

      {editFile && (
        <ImageEditorModal
          file={editFile}
          shape={shape}
          busy={uploading}
          onConfirm={uploadBlob}
          onCancel={() => setEditFile(null)}
        />
      )}
    </div>
  );
}
