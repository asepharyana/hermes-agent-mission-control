# Spec: AI-Generated Shorts Render (YT → MP4)

**Status:** ✅ IMPLEMENTED & DEPLOYED (2026-09-22)
**Date:** 2026-09-22
**Repo:** asepharyana/hermes-agent-mission-control
**Deploy:** Nix + Attic + systemd (hermyhq + hermyhq-render) di VPS

## Goal

Konversi script YouTube **approved** → video Shorts (9:16, ≤60s) otomatis:
TTS voiceover + visual bergerak + teks, direview di dashboard sebelum publish.

## Lingkungan (verified)

- VPS: ffmpeg 8.0.1, Google Chrome stable, 26 fonts, Bing TTS (edge-tts) reachable
- **Port fix**: hermyhq 4023→4024 (4023 = pr-agent-bun). Caddy `hamc.*` → 4024
- DB: PostgreSQL hermyhq (Prisma 6.19.2)

## Arsitektur

```
UI (youtube tab, approved)
  → POST /api/youtube/render {scriptId}     (set status render_queued)
  → hermyhq-render.service (worker poll loop, /opt/hermyhq-renderer)
      TTS (edge-tts) per segment
      → Remotion render (Chrome headless) silent 1080×1920
      → ffmpeg concat audio + mux + thumbnail
      → DB: status rendered, videoUrl/thumbnailUrl + YoutubeRender row
  → UI (Renders tab): preview video + [✓ Approved→tofilm] [✗ Reject] [⬇ Download]
```

## Files

- `src/remotion/` — ShortsVideo.tsx (segments → 9:16 video), parts.tsx (bg/caption/progress), index.tsx (registerRoot + calculateMetadata)
- `scripts/render-worker.mjs` — standalone poller (systemd hermyhq-render.service)
- `src/app/api/youtube/render/route.ts` — POST queue / GET status
- `src/app/api/youtube/render/file/route.ts` — stream MP4/JPG (Range support)
- `src/app/youtube/page.tsx` — Renders tab + Render Shorts button + review actions
- `prisma/schema.prisma` — YoutubeRender model, YoutubeScript.videoUrl/thumbnailUrl
- `remotion.config.ts` — Remotion config (Chrome executable)

## Verified (prod, 2026-09-22)

- Worker E2E: seed script approved → TTS 5 segmen (32.38s total) → Remotion render
  → ffmpeg mux → `/data/renders/<id>.mp4` (h264 1080×1920 + aac, 2.9MB) + .jpg
- DB: status `rendered`, YoutubeRender row (durationMs 32384, metadata)
- hermyhq-render.service: active, auto-restart
- CI: Build & Deploy success (push 33e85ce), dashboard live di 4024
- API: 401 Unauthorized dari luar (NextAuth protected — expected, dashboard-only)

## Remaining / Next

- **Login OAuth**: dashboard butuh login (Google OAuth belum configure di prod? — check ALLOWED_EMAILS)
- **UI test**: login → approve script → Render Shorts → preview di Renders tab
- **Upload ke YouTube API**: butuh OAuth (deferred)
- **Music background**: butuh sumber royalty-free (deferred)
- **Render speed**: ~5.6 fps (software Chrome), 32s short ≈ 2 menit render — OK untuk sekarang

## Keputusan

- Worker terpisah (systemd) — robust vs restart dashboard
- Remotion (programmatic) vs Veo/Runway — gratis, jalan di VPS, deterministic
- edge-tts gratis, verified reachable
- Tanpa musik background (hak cipta)