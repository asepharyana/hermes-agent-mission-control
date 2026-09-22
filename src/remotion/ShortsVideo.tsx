import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  SvgBackground,
  BrandTag,
  ProgressBar,
  GlassCard,
  CaptionKaraoke,
  KineticTitle,
  StatCounter,
  SlideMotion,
  TerminalScene,
  CompareScene,
  BulletScene,
  BangScene,
  MiniKaraoke,
} from "./parts";
import { TweetCard, ThreadCard, NewsCard } from "./cards";
import {
  ChartBars,
  ChartLine,
  RingProgress,
  Gauge,
  TickerTape,
  Countdown,
  NodeFlow,
  PulseBars,
  Checklist,
  HudFrame,
  StatBlock,
} from "./assets";

/** Asset pool — a visual building block sits above the caption card on
 *  regular caption scenes, chosen deterministically per (index, seed) so
 *  every video looks different. Reused across scenes via asset picker. */
const ASSET_POOL = [
  "chartbars",
  "chartline",
  "ring",
  "gauge",
  "ticker",
  "countdown",
  "nodeflow",
  "pulse",
  "checklist",
  "hud",
  "stat",
] as const;
type AssetKey = (typeof ASSET_POOL)[number];

const AssetDecor: React.FC<{ index: number; seed: number; text: string; label: string }> = ({ index, seed = 0, text, label }) => {
  // skip asset on tiny/labeled scenes? no — variety is the point; but CTA/HOOK
  // already have big visuals so only attach to caption-ish scenes by intent.
  const L = (label || "").toUpperCase();
  if (["CTA", "HOOK", "ON SCREEN"].includes(L)) return null;
  // Label-aware asset choice: THE STORY → growth charts, THE CONFLICT → bang
  // energy (pulse/ring), THE INSIGHT → checklist/nodeflow. Falls back to the
  // seeded pool for anything else, so videos vary regardless.
  let key: AssetKey;
  if (L === "THE STORY") {
    key = (["chartbars", "chartline", "ticker", "stat"] as AssetKey[])[(index + seed) % 4];
  } else if (L === "THE CONFLICT") {
    key = (["pulse", "ring", "gauge", "pulse"] as AssetKey[])[(index + seed) % 4];
  } else if (L === "THE INSIGHT") {
    key = (["checklist", "nodeflow", "stat", "checklist"] as AssetKey[])[(index + seed) % 4];
  } else if (L === "THE MISTAKE" || L === "WHY IT FAILS") {
    key = "pulse";
  } else if (L === "THE FIX") {
    key = "checklist";
  } else {
    key = ASSET_POOL[(index + seed) % ASSET_POOL.length];
  }
  const words = text.split(" ").length;
  // only show asset that "fits" — for now deterministic pick is fine
  const delay = (index + seed) % 6;
  const render = () => {
    switch (key) {
      case "chartbars": return <ChartBars bars={5} delay={delay} />;
      case "chartline": return <ChartLine delay={delay} />;
      case "ring": return <RingProgress pct={0.55 + ((seed + index) % 4) * 0.12} delay={delay} />;
      case "gauge": return <Gauge value={0.5 + ((seed + index) % 5) * 0.08} label={words > 5 ? "SIGNAL" : "GAUGE"} delay={delay} />;
      case "ticker": return <TickerTape text={text.slice(0, 60)} />;
      case "countdown": return <Countdown end={3} from={5 + (seed % 4)} delay={delay} />;
      case "nodeflow": return <NodeFlow delay={delay} />;
      case "pulse": return <PulseBars bars={12} delay={delay} />;
      case "checklist": return <Checklist items={["PLAN", "BUILD", "SHIP"]} delay={delay} />;
      case "hud": return <HudFrame label={words > 4 ? "SYSTEM" : "DATA"} />;
      case "stat": return <StatBlock value={`${(seed % 8) + 3}${index % 2 ? "M" : "%"}`} sub="REACH" />;
      default: return null;
    }
  };
  return (
    <div
      style={{
        position: "absolute",
        left: "8%", right: "8%", top: "18%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
        height: "36%",
        width: "84%",
        pointerEvents: "none",
      }}
    >
      {render()}
    </div>
  );
};

/** Sentence timing (karaoke), relative to segment start. */
export type Sentence = { w: string; start: number; end: number };

export type Segment = {
  text: string;
  duration: number; // frames
  label?: string;
  sentences?: Sentence[];
  /** optional explicit scene override */
  scene?: "title" | "stat" | "caption" | "cta" | "tweet" | "thread" | "news" | "terminal" | "compare" | "fix" | "bullets" | "bang";
  stat?: { value: string; label: string };
  /** source content (tweet/thread/news) — rendered as a visual card scene */
  source?: {
    type: "tweet" | "thread" | "news";
    handle?: string;
    name?: string;
    text?: string;
    isRoot?: boolean;
    likes?: number | null;
    retweets?: number | null;
    replies?: number | null;
    views?: number | null;
    tweets?: { text: string; name?: string }[];
    title?: string;
    excerpt?: string;
    author?: string;
    source?: string;
  };
};

/** Truncate at a word boundary (never cut mid-word). */
function clipWords(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.5 ? cut.slice(0, sp) : cut).trim() + "…";
}

/** Detect a big number/stat worth showing as a stat scene. */
function extractStat(text: string): { value: string; label: string } | null {
  const m = text.match(/(\$?\d+(?:[.,]\d+)?\s?[BMTK%]?)\s+(?:million|billion|trillion|percent|people|users|x)?/i);
  if (m && /\d/.test(m[1]) && /[$%]|\d\s?[BMTK]\b/i.test(m[1])) {
    const rest = text.replace(m[0], "").trim();
    const label = clipWords(rest, 60);
    if (label) return { value: m[1].trim(), label };
  }
  if (/\$?\d+(\.\d+)?\s?(billion|B|%|million|M)\b/i.test(text)) {
    const m2 = text.match(/(\$?\d+(?:\.\d+)?\s?(?:billion|B|%|million|M))/i);
    if (m2) {
      const rest = text.replace(m2[0], "").trim();
      return { value: m2[1], label: clipWords(rest, 60) || "…" };
    }
  }
  return null;
}

/** Pick a scene for this segment (variety — pattern interrupt every cut). */
function pickScene(seg: Segment, index: number, seed = 0): Segment["scene"] | "caption" {
  if (seg.scene) return seg.scene;
  const label = (seg.label || "").toUpperCase();
  const i = (index + seed) % 5;
  // AI-tips scenes handled by worker override; here we only route the shared
  // creative variety (bang for twist, bullets for insight) — HOOK stays title.
  if (label === "THE MISTAKE" || label === "WHY IT FAILS") return "compare";
  if (label === "THE FIX") return "fix";
  if (label === "THE INSIGHT") return "bullets";
  if (label === "THE CONFLICT") return "bang";
  if (label === "HOOK" || label === "ON SCREEN") return "title";
  if (label === "CTA") return "cta";
  if (seg.source) return seg.source.type as "tweet" | "thread" | "news";
  if (seg.stat) return "stat";
  const stat = extractStat(seg.text);
  if (stat) return "stat";
  if (i % 3 === 2) return "title";
  return "caption";
}

/** One scene rendered for `duration` frames. */
const Scene: React.FC<{
  seg: Segment;
  index: number;
  from: number;
  seed?: number;
}> = ({ seg, index, from, seed = 0 }) => {
  const { duration, label, text } = seg;
  const scene = pickScene(seg, index, seed);
  const stat = seg.stat || (scene === "stat" ? extractStat(text) : null);
  const sentences =
    seg.sentences && seg.sentences.length
      ? seg.sentences
      : [{ w: text, start: 0, end: duration / 30 }];
  const src = seg.source;

  // creative scenes: big visual + compact caption strip below
  if (scene === "terminal") {
    return (
      <AbsoluteFill>
        <SvgBackground variant={index + (seed || 0)} />
        <SlideMotion>
          {label ? <BrandTag label={label} /> : null}
          <TerminalScene text={text} />
          <MiniKaraoke sentences={sentences} />
          <ProgressBar total={duration} />
        </SlideMotion>
      </AbsoluteFill>
    );
  }
  if (scene === "compare" || scene === "fix") {
    return (
      <AbsoluteFill>
        <SvgBackground variant={index + (seed || 0)} />
        <SlideMotion>
          {label ? <BrandTag label={label} /> : null}
          <CompareScene text={text} side={scene === "fix" ? "good" : "bad"} />
          <MiniKaraoke sentences={sentences} />
          <ProgressBar total={duration} />
        </SlideMotion>
      </AbsoluteFill>
    );
  }
  if (scene === "bullets") {
    return (
      <AbsoluteFill>
        <SvgBackground variant={index + (seed || 0)} />
        <SlideMotion>
          {label ? <BrandTag label={label} /> : null}
          <BulletScene text={text} />
          <MiniKaraoke sentences={sentences} />
          <ProgressBar total={duration} />
        </SlideMotion>
      </AbsoluteFill>
    );
  }
  if (scene === "bang") {
    return (
      <AbsoluteFill>
        <SvgBackground variant={index + (seed || 0)} />
        <SlideMotion>
          {label ? <BrandTag label={label} /> : null}
          <BangScene text={text} />
          <MiniKaraoke sentences={sentences} />
          <ProgressBar total={duration} />
        </SlideMotion>
      </AbsoluteFill>
    );
  }
  if (scene === "caption" || scene === "title" || scene === "cta") {
    // regular scenes get an animated asset above the card (variety!)
    return (
      <AbsoluteFill>
        <SvgBackground variant={index + (seed || 0)} />
        <SlideMotion>
          {label ? <BrandTag label={label} /> : null}
          {scene === "caption" ? (
            <AssetDecor index={index} seed={seed} text={text} label={label || ""} />
          ) : null}
          <KineticTitle text={titleFor(seg)} size={54} />
          <GlassCard>
            <CaptionKaraoke sentences={sentences} size={44} />
          </GlassCard>
          <ProgressBar total={duration} />
        </SlideMotion>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <SvgBackground variant={index + (seed || 0)} />
      <SlideMotion>
        {label ? <BrandTag label={label} /> : null}

        {scene === "tweet" && src ? (
          <TweetCard
            handle={src.handle || ""}
            name={src.name || src.handle || ""}
            text={src.text || text}
            likes={src.likes}
            retweets={src.retweets}
            replies={src.replies}
            views={src.views}
          />
        ) : scene === "thread" && src?.tweets ? (
          <ThreadCard handle={src.handle || ""} tweets={src.tweets} />
        ) : scene === "news" && src ? (
          <NewsCard
            title={src.title || text}
            excerpt={src.excerpt}
            author={src.author}
            source={src.source}
          />
        ) : scene === "stat" && stat ? (
          <StatCounter value={stat.value} label={stat.label} />
        ) : (
          <KineticTitle text={titleFor(seg)} size={54} />
        )}

        <ProgressBar total={duration} />
        {/* time code (subtle, right side) */}
        <div
          style={{
            position: "absolute",
            right: "6%",
            bottom: "6.4%",
            color: "rgba(255,255,255,0.42)",
            fontSize: 24,
            fontFamily: "monospace",
            letterSpacing: "0.1em",
          }}
        >
          {(from / 30).toFixed(1)}s
        </div>
      </SlideMotion>
    </AbsoluteFill>
  );
};

/** Section headline above the caption card. */
function titleFor(seg: Segment): string {
  const label = (seg.label || "").toUpperCase();
  const map: Record<string, string> = {
    "THE STORY": "The story",
    "THE CONFLICT": "The twist",
    "THE INSIGHT": "The lesson",
  };
  if (map[label]) return map[label];
  return label ? label.charAt(0) + label.slice(1).toLowerCase() : "";
}

/** Composition: each scene time-gated by Sequence (frame resets per scene). */
export const ShortsVideo: React.FC<{ segments: Segment[]; seed?: number }> = ({ segments, seed = 0 }) => {
  let acc = 0;
  return (
    <>
      {segments.map((s, i) => {
        const from = acc;
        acc += s.duration;
        return (
          <Sequence key={i} from={from} durationInFrames={s.duration}>
            <Scene seg={s} index={i} from={from} seed={seed} />
          </Sequence>
        );
      })}
    </>
  );
};

export const useTotalDuration = (segments: { duration: number }[]) =>
  segments.reduce((a, s) => a + s.duration, 0);