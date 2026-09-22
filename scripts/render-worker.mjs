#!/usr/bin/env node
/**
 * Hermy HQ — Shorts render worker.
 *
 * Polls the DB for YoutubeScript rows with status "approved" (or "render_queued")
 * and renders them into a 9:16 MP4 short:
 *   1. TTS  → per-segment mp3 (edge-tts, free)
 *   2. Time → ffprobe each mp3, build Remotion segment timeline (≤60s)
 *   3. Render → Remotion (Chrome headless) → silent MP4
 *   4. Mux  → ffmpeg: silent MP4 + concatenated TTS audio → final MP4
 *   5. Thumb → ffmpeg snapshot frame → JPG
 *   6. DB   → status "rendered", videoUrl/thumbnailUrl/duration + render row
 *
 * Run as: systemd service `hermyhq-render.service` (poll loop).
 * Env: DATABASE_URL (via env file), RENDER_DIR=/data/renders,
 *      EDGE_TTS_BIN, TTS_VOICE, CHROME_BIN, REMOTION_ROOT.
 */
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import path from "path";
import { execFileSync } from "child_process";

const prisma = new PrismaClient();
const RENDER_DIR = process.env.RENDER_DIR || "/data/renders";
const EDGE_TTS_BIN =
  process.env.EDGE_TTS_BIN ||
  (existsSync("/home/code/.hermes/hermes-agent/venv/bin/edge-tts")
    ? "/home/code/.hermes/hermes-agent/venv/bin/edge-tts"
    : "edge-tts");
const VOICE = process.env.TTS_VOICE || "en-US-ChristopherNeural";
const VOICE_TIPS = process.env.TTS_VOICE_TIPS || "en-US-GuyNeural"; // tech/explainer
const CHROME = process.env.CHROME_BIN || "/usr/bin/google-chrome-stable";
const MAX_TOTAL_SEC = 60;
const FPS = 30;
const POLL_MS = Number(process.env.POLL_MS || 5000);
const SCRATCH = process.env.RENDER_SCRATCH || "/tmp/hamc-render";

mkdirSync(RENDER_DIR, { recursive: true });
mkdirSync(SCRATCH, { recursive: true });

const REMOTION_ROOT = path.resolve(process.env.REMOTION_ROOT || "./src/remotion");
const REMOTION_ENTRY = path.join(REMOTION_ROOT, "index.tsx");
const TTS_PYTHON =
  process.env.TTS_PYTHON ||
  (existsSync("/home/code/.hermes/hermes-agent/venv/bin/python3")
    ? "/home/code/.hermes/hermes-agent/venv/bin/python3"
    : "python3");
const TTS_WORDS_PY = path.resolve(process.env.TTS_WORDS_PY || "./scripts/tts-words.py");
const SOURCE_FETCH_MJS = path.resolve(process.env.SOURCE_FETCH_MJS || "./scripts/source-fetch.mjs");

/** Fetch source content (tweet/thread/news) for a URL via source-fetch.mjs. */
function fetchSource(url) {
  if (!url) return null;
  try {
    const out = execFileSync(process.execPath, [SOURCE_FETCH_MJS, url], {
      timeout: 40_000,
      encoding: "utf-8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

/** Convert fetched source data → src card shape for Remotion scenes. */
function sourceToCard(fetched) {
  if (!fetched || fetched.type === "error") return null;
  if (fetched.type === "tweet") {
    const root = fetched.tweets?.find((t) => t.isRoot) || fetched.tweets?.[0];
    if (!root) return null;
    if (fetched.tweets.length > 1) {
      return {
        type: "thread",
        handle: fetched.handle,
        tweets: fetched.tweets.map((t) => ({ text: t.text, name: t.name })),
      };
    }
    return {
      type: "tweet",
      handle: root.handle,
      name: root.name,
      text: root.text,
      likes: root.likes,
      retweets: root.retweets,
      replies: root.replies,
      views: root.views,
    };
  }
  if (fetched.type === "news") {
    return {
      type: "news",
      title: fetched.title,
      excerpt: fetched.excerpt,
      author: fetched.author,
      source: new URL(fetched.url).hostname.replace(/^www\./, ""),
    };
  }
  return null;
}

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${r.status}): ${(r.stderr || r.stdout).slice(0, 2000)}`);
  }
  return r;
}

function tts(text, outBase, voice = VOICE) {
  const out = `${outBase}.mp3`;
  const srt = `${outBase}.sentences.json`;
  sh(
    TTS_PYTHON,
    [TTS_WORDS_PY, text, voice, out, srt],
    { timeout: 60_000, env: { ...process.env } }
  );
  let sentences = [];
  try {
    sentences = JSON.parse(readFileSync(srt, "utf-8"));
  } catch { /* fallback: single sentence */ }
  if (!sentences.length) sentences = [{ w: text, start: 0, end: 0 }];
  return { file: out, durationSec: ffprobeDuration(out), sentences };
}

function ffprobeDuration(file) {
  const r = sh("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ], { allowFail: true });
  const v = parseFloat((r.stdout || "").trim());
  return Number.isFinite(v) ? v : 0;
}

function ffprobeSize(file) {
  const r = sh("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0", file,
  ], { allowFail: true });
  return (r.stdout || "").trim();
}

function log(...a) { console.log(new Date().toISOString(), ...a); }

/** Truncate at a word boundary (never cut mid-word). */
function clipWords(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.5 ? cut.slice(0, sp) : cut).trim() + "…";
}

/** Detect a stat worth rendering as a big-number scene: $12B, 65%, 3.2M. */
function extractStatData(text) {
  const m = text.match(/(\$?\d+(?:\.\d+)?\s?(?:[BMK]%|billion|million|%))/i);
  if (!m) return null;
  const rest = text.replace(m[0], "").replace(/^[^A-Za-z0-9]+/, "").trim();
  if (rest.length < 5) return null;
  return { value: m[1].trim(), label: clipWords(rest, 70) };
}

/** Build segment text list from a YoutubeScript's structured fields. */
function buildSegments(script) {
  const isTips = script.category === "ai-agent-tips";
  const segs = [];
  const push = (text, label, highlight) => {
    const clean = (text || "").trim();
    const chunk = clean.length > 180 ? clean.slice(0, 180) + "…" : clean;
    if (chunk) segs.push({ text: chunk, label, highlight });
  };
  // For AI-agent tips: labels = MISTAKE / THE FIX instead of THE STORY / ...
  if (isTips) {
    push(script.hook, "HOOK", script.hook);
    push(script.onScreenText, "ON SCREEN", script.onScreenText);
    push(script.storySetup, "THE MISTAKE", null);
    push(script.conflict, "WHY IT FAILS", null);
    push(script.insight, "THE FIX", null);
    push(script.cta, "CTA", null);
  } else {
    push(script.hook, "HOOK", script.hook);
    push(script.onScreenText, "ON SCREEN", script.onScreenText);
    push(script.storySetup, "THE STORY", null);
    push(script.conflict, "THE CONFLICT", null);
    push(script.insight, "THE INSIGHT", null);
    push(script.cta, "CTA", null);
  }
  if (segs.length === 0) push(script.fullScript || script.title, script.title || "SHORTS", null);
  return segs;
}

/** Render one script → {mp4, thumb, durationSec, segments}. */
async function renderScript(script) {
  const id = script.id;
  const work = path.join(SCRATCH, id);
  mkdirSync(work, { recursive: true });

  // 1. TTS per segment
  const baseSegs = buildSegments(script);
  log(`[${id}] TTS: ${baseSegs.length} segments`);
  const voiced = [];
  for (let i = 0; i < baseSegs.length; i++) {
    const s = baseSegs[i];
    const t = tts(s.text, path.join(work, `seg${i}`), script.category === "ai-agent-tips" ? VOICE_TIPS : VOICE);
    voiced.push({ ...s, ...t });
    log(`[${id}] seg${i}: ${t.durationSec.toFixed(2)}s "${s.text.slice(0, 40)}"`);
  }

  // 1b. Fetch source content (tweet/thread/news) if script has sourceUrl
  let sourceCard = null;
  if (script.sourceUrl) {
    log(`[${id}] fetching source: ${script.sourceUrl}`);
    const fetched = fetchSource(script.sourceUrl);
    sourceCard = sourceToCard(fetched);
    log(`[${id}] source → ${sourceCard ? sourceCard.type : "fetch failed (skip card)"}`);
  }

  // 2. Trim to ≤ MAX_TOTAL_SEC (keep head, drop tail)
  let totalSec = voiced.reduce((a, s) => a + s.durationSec, 0);
  if (totalSec > MAX_TOTAL_SEC) {
    log(`[${id}] total ${totalSec.toFixed(2)}s > ${MAX_TOTAL_SEC}s, trimming tail`);
    const keep = [];
    let acc = 0;
    for (const s of voiced) {
      if (acc + s.durationSec <= MAX_TOTAL_SEC) { keep.push(s); acc += s.durationSec; }
      else break;
    }
    if (keep.length === 0) keep.push(voiced[0]); // always keep ≥1 segment
    voiced.length = 0;
    voiced.push(...keep);
    totalSec = voiced.reduce((a, s) => a + s.durationSec, 0);
  }

  // 3. Remotion timeline (frames)
  const timeline = voiced.map((s) => {
    const t = {
      text: s.text,
      duration: Math.max(30, Math.round(s.durationSec * FPS)),
      label: s.label,
      sentences: s.sentences || undefined,
      stat: extractStatData(s.text),
    };
    // AI-agent tips: force scene per label for the terminal/compare/bullets/bang
    // variety (brands keep their own kinetic/caption mapping).
    const L = (s.label || "").toUpperCase();
    if (script.category === "ai-agent-tips") {
      if (L === "HOOK") t.scene = "terminal";
      else if (L === "THE MISTAKE" || L === "WHY IT FAILS") t.scene = "compare";
      else if (L === "THE FIX") t.scene = "fix";
      else if (L === "THE INSIGHT") t.scene = "bullets";
      else if (L === "THE CONFLICT") t.scene = "bang";
      else if (L === "CTA") t.scene = "cta";
    }
    return t;
  });

  // Inject source card scene — REPLACES the visual of the 2nd segment
  // (story). Total timeline duration stays == audio duration, so the mux
  // stays in sync (no -shortest tail loss). The story voiceover keeps
  // playing while the actual tweet/news card is shown on screen.
  if (sourceCard && timeline.length >= 2) {
    const idx = Math.min(1, timeline.length - 1);
    const cardScene = {
      text: sourceCard.type === "news" ? (sourceCard.title || "") : (sourceCard.text || sourceCard.tweets?.[0]?.text || ""),
      duration: timeline[idx].duration, // same duration — replaces, not adds
      label: sourceCard.type === "news" ? "SOURCE" : "ORIGINAL",
      source: sourceCard,
    };
    timeline.splice(idx, 1, cardScene);
    log(`[${id}] replaced seg${idx} visual with ${sourceCard.type} card (${cardScene.duration / FPS}s)`);
  }

  // 4. Render silent video via Remotion CLI (props = segments JSON)
  const silentMp4 = path.join(work, "silent.mp4");
  log(`[${id}] Remotion render ${timeline.length} segs → silent.mp4`);
  sh("npx", [
    "--yes", "remotion", "render", REMOTION_ENTRY, "Shorts", silentMp4,
    "--codec=h264", "--crf=20", "--browser-executable=" + CHROME,
    "--props=" + JSON.stringify({ segments: timeline }),
    "--concurrency=6",
    "--log=info",
  ], { timeout: 600_000, env: { ...process.env } });

  // Verify silent video has expected duration (sanity)
  const silentDur = ffprobeDuration(silentMp4);
  if (!(silentDur > 0.5)) throw new Error(`silent render empty: ${silentDur}s`);

  // 5. Concat TTS → m4a
  const concatFile = path.join(work, "concat.txt");
  writeFileSync(concatFile, voiced.map(s => `file '${s.file}'`).join("\n"));
  const audioM4a = path.join(work, "audio.m4a");
  sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c:a", "aac", audioM4a], { timeout: 120_000 });

  // 6. Final mux
  const finalMp4 = path.join(RENDER_DIR, `${id}.mp4`);
  sh("ffmpeg", [
    "-y", "-i", silentMp4, "-i", audioM4a,
    "-c:v", "copy", "-c:a", "aac", "-shortest",
    "-movflags", "+faststart", finalMp4,
  ], { timeout: 120_000 });

  // 7. Thumbnail at 1s
  const thumb = path.join(RENDER_DIR, `${id}.jpg`);
  sh("ffmpeg", ["-y", "-ss", "1", "-i", finalMp4, "-vframes", "1", "-q:v", "2", thumb], { timeout: 30_000 });

  const dur = ffprobeDuration(finalMp4);
  if (!(dur > 0.5)) throw new Error(`final render empty: ${dur}s`);
  return { mp4: finalMp4, thumb, durationSec: dur, segments: voiced.length };
}

async function markRendered(script, result) {
  await prisma.youtubeRender.upsert({
    where: { scriptId: script.id },
    update: {
      status: "rendered",
      videoPath: result.mp4,
      thumbnailPath: result.thumb,
      durationMs: Math.round(result.durationSec * 1000),
      metadata: { segments: result.segments, size: ffprobeSize(result.mp4), version: 1 },
      error: null,
    },
    create: {
      scriptId: script.id,
      status: "rendered",
      videoPath: result.mp4,
      thumbnailPath: result.thumb,
      durationMs: Math.round(result.durationSec * 1000),
      metadata: { segments: result.segments, size: ffprobeSize(result.mp4), version: 1 },
    },
  });
  await prisma.youtubeScript.update({
    where: { id: script.id },
    data: { status: "rendered", videoUrl: result.mp4, thumbnailUrl: result.thumb },
  });
}

async function failScript(script, err) {
  log(`[${script.id}] FAILED:`, err.message || err);
  await prisma.youtubeRender.upsert({
    where: { scriptId: script.id },
    update: { status: "failed", error: String(err.message || err).slice(0, 2000) },
    create: { scriptId: script.id, status: "failed", error: String(err.message || err).slice(0, 2000) },
  });
}

async function main() {
  log(`worker ready: dir=${RENDER_DIR} chrome=${CHROME} tts=${EDGE_TTS_BIN} poll=${POLL_MS}ms`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const jobs = await prisma.youtubeScript.findMany({
        where: { status: { in: ["approved", "render_queued"] } },
        take: 1,
        orderBy: { updatedAt: "asc" },
      });
      if (jobs.length === 0) {
        await sleep(POLL_MS);
        continue;
      }
      const job = jobs[0];
      log(`[${job.id}] picking up "${job.title}"`);
      await prisma.youtubeScript.update({ where: { id: job.id }, data: { status: "render_queued" } });
      const result = await renderScript(job);
      await markRendered(job, result);
      log(`[${job.id}] DONE ${result.durationSec.toFixed(2)}s @ ${result.mp4}`);
    } catch (e) {
      log("main loop error:", e.message || e);
      try {
        const job = await prisma.youtubeScript.findFirst({ where: { status: "render_queued" } });
        if (job) await failScript(job, e);
      } catch {}
      await sleep(POLL_MS * 2);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

process.on("SIGINT", async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });

main().catch(async (e) => {
  console.error("FATAL", e);
  await prisma.$disconnect();
  process.exit(1);
});