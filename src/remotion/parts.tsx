import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import "@fontsource/inter/700.css";
import "@fontsource/montserrat/800.css";

/* ─────────────────────────────────────────────────────────────────────────
   Shorts design system.
   Fonts: Inter 700 (captions/body), Montserrat 800 (display).
   Safe zone: 900×1400 centered (universal TikTok/Reels/Shorts).
   Perf rule: NO blur filters / SVG noise (software Chrome ~10x slower).
   ───────────────────────────────────────────────────────────────────────── */

export const FONT_DISPLAY = "Montserrat, Inter, system-ui, sans-serif";
export const FONT_BODY = "Inter, system-ui, sans-serif";

/** Per-segment background palette (variety between scenes). */
const PALETTES = [
  { base: "linear-gradient(155deg,#0b1020 0%,#141a33 45%,#1b1030 100%)", a1: "99,102,241", a2: "236,72,153" },
  { base: "linear-gradient(155deg,#0a1628 0%,#0e2a3a 45%,#0a1f2e 100%)", a1: "56,189,248", a2: "16,185,129" },
  { base: "linear-gradient(155deg,#160b20 0%,#2a1040 45%,#1b0a2e 100%)", a1: "168,85,247", a2: "244,114,182" },
  { base: "linear-gradient(155deg,#1a0f0b 0%,#2e1a12 45%,#21100a 100%)", a1: "251,146,60", a2: "239,68,68" },
];

/** Animated background: gradient + drifting pre-softened orbs + dot grid. */
export const SvgBackground: React.FC<{ variant?: number }> = ({ variant = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 60;
  const p = PALETTES[variant % PALETTES.length];

  return (
    <AbsoluteFill style={{ background: p.base }}>
      <div
        style={{
          position: "absolute",
          width: width * 0.85,
          height: width * 0.85,
          left: width * 0.08 + Math.sin(t * 0.9) * 70,
          top: height * 0.06 + Math.sin(t * 0.7) * 50,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${p.a1},0.34) 0%, rgba(${p.a1},0.16) 42%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.65,
          height: width * 0.65,
          right: -width * 0.12 + Math.cos(t * 1.1) * 60,
          bottom: height * 0.16 + Math.cos(t * 0.8) * 40,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${p.a2},0.30) 0%, rgba(${p.a2},0.13) 42%, transparent 70%)`,
        }}
      />
      {/* faint dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};

/** Glass card (translucent, rounded, border) for caption blocks. */
export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 15, stiffness: 110 } });
  return (
    <div
      style={{
        position: "absolute",
        left: "5%",
        right: "5%",
        bottom: "13%",
        padding: "30px 32px",
        borderRadius: 28,
        background: "rgba(8,10,18,0.68)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 14px 44px rgba(0,0,0,0.4)",
        transform: `translateY(${(1 - pop) * 26}px) scale(${0.97 + pop * 0.03})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Karaoke caption: active sentence full-bright, others dimmed (synced to TTS). */
export const CaptionKaraoke: React.FC<{
  sentences: { w: string; start: number; end: number }[];
  size?: number;
}> = ({ sentences, size = 44 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps;

  let activeIdx = 0;
  for (let i = 0; i < sentences.length; i++) {
    if (now >= sentences[i].start) { activeIdx = i; break; }
  }
  const active = sentences[activeIdx];
  const flash = active
    ? interpolate(now, [active.start, active.start + 0.12, active.start + 0.35], [1, 1.06, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.34,
        color: "#ffffff",
        letterSpacing: "-0.01em",
        textShadow: "0 2px 14px rgba(0,0,0,0.55)",
        transform: `scale(${flash})`,
        transformOrigin: "left center",
      }}
    >
      {sentences.map((s, i) => (
        <span key={i} style={{ opacity: i === activeIdx ? 1 : 0.4 }}>
          {s.w}
          {i < sentences.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

/** Big display title with word-by-word kinetic entrance. */
export const KineticTitle: React.FC<{
  text: string;
  size?: number;
  accentIndex?: number;
  accentColor?: string;
  position?: "top" | "center";
}> = ({ text, size = 88, accentIndex = -1, accentColor = "#a5b4fc", position = "top" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 100 } });
  const words = text.split(" ");
  const dur = Math.max(1, Math.floor(fps * 0.15));

  return (
    <div
      style={{
        position: "absolute",
        left: "5%",
        right: "5%",
        top: position === "center" ? "30%" : "12%",
        transform: `translateY(${(1 - pop) * 40}px)`,
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.2em",
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: i === accentIndex ? accentColor : "#ffffff",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            opacity: interpolate(frame, [i * dur, i * dur + dur * 0.5], [0, 1], {
              extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(frame, [i * dur, i * dur + dur * 0.6], [0.78, 1], {
              extrapolateRight: "clamp",
            })})`,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};

/** Huge stat/number card (pattern interrupt for facts). */
export const StatCounter: React.FC<{
  value: string;
  label: string;
  color?: string;
}> = ({ value, label, color = "#a5b4fc" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        top: "34%",
        textAlign: "center",
        transform: `scale(${0.85 + pop * 0.15})`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 132,
          color,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          textShadow: "0 6px 30px rgba(0,0,0,0.55)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 36,
          color: "rgba(255,255,255,0.8)",
          marginTop: 20,
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Top-left scene label pill. */
export const BrandTag: React.FC<{ label: string; variant?: number }> = ({ label, variant = 0 }) => {
  const p = PALETTES[variant % PALETTES.length];
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        top: "6%",
        padding: "10px 22px",
        borderRadius: 999,
        background: `rgba(${p.a1},0.16)`,
        border: `1px solid rgba(${p.a1},0.45)`,
        color: `rgb(${p.a1})`,
        fontSize: 30,
        fontWeight: 700,
        fontFamily: FONT_BODY,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

/** Bottom progress bar (per-segment fill). */
export const ProgressBar: React.FC<{ total: number; variant?: number }> = ({ total, variant = 0 }) => {
  const frame = useCurrentFrame();
  const p = PALETTES[variant % PALETTES.length];
  const pct = interpolate(frame, [0, total], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        bottom: "6%",
        height: 8,
        borderRadius: 99,
        background: "rgba(255,255,255,0.16)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 99,
          background: `linear-gradient(90deg, rgb(${p.a1}), rgb(${p.a2}))`,
        }}
      />
    </div>
  );
};

/** Slow ken-burns style camera motion wrapper (transform only — cheap). */
export const SlideMotion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const y = Math.sin(t * 1.4) * 14;
  const scale = 1 + Math.sin(t * 0.8) * 0.014;
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};