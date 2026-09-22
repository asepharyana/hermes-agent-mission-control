import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/youtube/render {scriptId}
 * Queue a script for shorts rendering: status approved → render_queued.
 * The standalone worker (hermyhq-render.service) picks it up and renders.
 */
export async function POST(req: NextRequest) {
  const { scriptId } = await req.json().catch(() => ({}));
  if (!scriptId) return NextResponse.json({ error: "scriptId required" }, { status: 400 });

  const script = await prisma.youtubeScript.findUnique({ where: { id: scriptId } });
  if (!script) return NextResponse.json({ error: "script not found" }, { status: 404 });
  if (script.status !== "approved") {
    return NextResponse.json(
      { error: `script must be 'approved' to render (current: ${script.status})` },
      { status: 409 }
    );
  }

  const updated = await prisma.youtubeScript.update({
    where: { id: scriptId },
    data: { status: "render_queued" },
  });

  return NextResponse.json({ ok: true, scriptId, status: updated.status });
}

/**
 * GET /api/youtube/render?scriptId=xxx
 * Current render status + file paths for a script.
 */
export async function GET(req: NextRequest) {
  const scriptId = req.nextUrl.searchParams.get("scriptId");
  if (!scriptId) return NextResponse.json({ error: "scriptId required" }, { status: 400 });

  const render = await prisma.youtubeRender.findUnique({ where: { scriptId } });
  const script = await prisma.youtubeScript.findUnique({ where: { id: scriptId } });
  if (!script) return NextResponse.json({ error: "script not found" }, { status: 404 });

  return NextResponse.json({
    scriptId,
    scriptStatus: script.status,
    videoUrl: script.videoUrl,
    thumbnailUrl: script.thumbnailUrl,
    render: render
      ? {
          status: render.status,
          durationMs: render.durationMs,
          error: render.error,
          metadata: render.metadata,
        }
      : null,
  });
}