import { NextResponse } from "next/server";
import { requireRoleApi, ROLES } from "@/lib/auth-guards";
import { saveUpload, extForMime, MAX_UPLOAD_BYTES } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Staff image upload (staff & manager photos). Returns a servable URL. */
export async function POST(req: Request) {
  const { response } = await requireRoleApi([ROLES.ADMIN, ROLES.PROVIDER]);
  if (response) return response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی ارسال نشد" }, { status: 400 });
  }
  if (!extForMime(file.type)) {
    return NextResponse.json({ error: "فقط فایل تصویری مجاز است" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "حجم تصویر باید کمتر از ۳۵ مگابایت باشد" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const url = await saveUpload(bytes, file.type);
  return NextResponse.json({ ok: true, url });
}
