import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/youtube/render/file?scriptId=xxx&kind=video|thumb
 * Streams the rendered MP4 or thumbnail JPG from the local render dir.
 * Only serves files for scripts that are in a rendered state.
 */
export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get("scriptId");
  const kind = req.nextUrl.searchParams.get("kind") || "video";
  if (!scriptId) return NextResponse.json({ error: "scriptId required" }, { status: 400 });

  const script = await prisma.youtubeScript.findUnique({ where: { id: scriptId } });
  if (!script) return NextResponse.json({ error: "script not found" }, { status: 404 });

  const filePath = kind === "thumb" ? script.thumbnailUrl : script.videoUrl;
  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: "render not ready" }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === ".jpg" ? "image/jpeg" : ext === ".mp4" ? "video/mp4" : "application/octet-stream";
  const stat = fs.statSync(filePath);

  // Range support for <video> seeking (bytes=start-end)
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
    if (start >= stat.size || start > end) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    const stream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const stream = fs.createReadStream(filePath);
  return new NextResponse(stream as any, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    },
  });
}