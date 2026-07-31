import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { resolveUpload, contentTypeForName } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Serve a previously-uploaded image from the persistent uploads dir. */
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const name = params.path?.join("/") ?? "";
  const abs = resolveUpload(name);
  if (!abs) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await fs.readFile(abs);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeForName(name),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
