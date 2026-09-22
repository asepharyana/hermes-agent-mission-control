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
} from "./parts";

/** Sentence timing (karaoke), relative to segment start. */
export type Sentence = { w: string; start: number; end: number };

export type Segment = {
  text: string;
  duration: number; // frames
  label?: string;
  sentences?: Sentence[];
  /** optional explicit scene override */
  scene?: "title" | "stat" | "caption" | "cta";
  stat?: { value: string; label: string };
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
function pickScene(seg: Segment, index: number): "title" | "stat" | "caption" | "cta" {
  if (seg.scene) return seg.scene;
  const label = (seg.label || "").toUpperCase();
  if (label === "HOOK" || label === "ON SCREEN") return "title";
  if (label === "CTA") return "cta";
  if (seg.stat) return "stat";
  const stat = extractStat(seg.text);
  if (stat) return "stat";
  if (index % 3 === 2) return "title";
  return "caption";
}

/** One scene rendered for `duration` frames. */
const Scene: React.FC<{
  seg: Segment;
  index: number;
  from: number;
}> = ({ seg, index, from }) => {
  const { duration, label, text } = seg;
  const scene = pickScene(seg, index);
  const stat = seg.stat || (scene === "stat" ? extractStat(text) : null);
  const sentences =
    seg.sentences && seg.sentences.length
      ? seg.sentences
      : [{ w: text, start: 0, end: duration / 30 }];

  return (
    <AbsoluteFill>
      <SvgBackground variant={index} />
      <SlideMotion>
        {label ? <BrandTag label={label} /> : null}

        {scene === "stat" && stat ? (
          <StatCounter value={stat.value} label={stat.label} />
        ) : scene === "title" || scene === "cta" ? (
          <>
            <KineticTitle
              text={text}
              size={scene === "cta" ? 76 : 88}
              position={scene === "cta" ? "center" : "top"}
              accentIndex={scene === "cta" ? -1 : text.split(" ").length - 1}
            />
            <GlassCard style={{ padding: "22px 28px" }}>
              <CaptionKaraoke sentences={sentences} size={38} />
            </GlassCard>
          </>
        ) : (
          <>
            <KineticTitle text={titleFor(seg)} size={54} />
            <GlassCard>
              <CaptionKaraoke sentences={sentences} size={44} />
            </GlassCard>
          </>
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
export const ShortsVideo: React.FC<{ segments: Segment[] }> = ({ segments }) => {
  let acc = 0;
  return (
    <>
      {segments.map((s, i) => {
        const from = acc;
        acc += s.duration;
        return (
          <Sequence key={i} from={from} durationInFrames={s.duration}>
            <Scene seg={s} index={i} from={from} />
          </Sequence>
        );
      })}
    </>
  );
};

export const useTotalDuration = (segments: { duration: number }[]) =>
  segments.reduce((a, s) => a + s.duration, 0);