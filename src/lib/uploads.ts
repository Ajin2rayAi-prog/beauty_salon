import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Persistent directory for user-uploaded images (staff & manager photos).
 *
 * On Railway a Volume is mounted at `/data`, so anything written there survives
 * redeploys — hence the production default `/data/uploads`. Locally we fall back
 * to a `.uploads` dir in the project root. Override with the `UPLOAD_DIR` env.
 * Files are served back through the `/api/uploads/[name]` route (not the static
 * `public/` dir), so this works identically in dev and on the Railway volume.
 */
export function uploadDir(): string {
  return (
    process.env.UPLOAD_DIR ||
    (process.env.NODE_ENV === "production"
      ? "/data/uploads"
      : path.join(process.cwd(), ".uploads"))
  );
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/** Allowed image mime → file extension, or null if unsupported. */
export function extForMime(mime: string): string | null {
  return MIME_EXT[mime] ?? null;
}

/** Save raw image bytes under a random name; returns the public URL to serve it. */
export async function saveUpload(bytes: Buffer, mime: string): Promise<string> {
  const ext = extForMime(mime);
  if (!ext) throw new Error("فرمت تصویر پشتیبانی نمی‌شود");
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, name), bytes);
  return `/api/uploads/${name}`;
}

/** Resolve a stored filename to an absolute path, guarding against traversal. */
export function resolveUpload(name: string): string | null {
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) return null;
  return path.join(uploadDir(), name);
}

/** Best-effort content type from a stored filename's extension. */
export function contentTypeForName(name: string): string {
  switch (name.split(".").pop()?.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
