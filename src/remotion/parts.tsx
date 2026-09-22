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
   Shorts design system — MONOCHROME FLAT.
   No gradients, no purple. Black & white, flat shapes, bold typography.
   Fonts: Montserrat 800 (display), Inter 700 (captions/body).
   Safe zone: 900×1400 centered (universal TikTok/Reels/Shorts).
   Perf rule: NO blur / SVG noise filters (software Chrome ~10x slower).
   ───────────────────────────────────────────────────────────────────────── */

export const FONT_DISPLAY = "Montserrat, Inter, system-ui, sans-serif";
export const FONT_BODY = "Inter, system-ui, sans-serif";

/** Solid near-black scene backgrounds (subtle variety, still monochrome). */
const SCENES = [
  { bg: "#0d0d0f", motif: "circles" },    // concentric ring
  { bg: "#121216", motif: "plus" },       // plus marks
  { bg: "#101014", motif: "barcode" },    // vertical bars
  { bg: "#15151a", motif: "rings" },      // target rings
  { bg: "#0f0f12", motif: "diag" },       // diagonal ticks
];

/** Flat mono background: solid color + faint white SVG motif per scene. */
export const SvgBackground: React.FC<{ variant?: number }> = ({ variant = 0 }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / 60;
  const s = SCENES[variant % SCENES.length];
  const stroke = "rgba(255,255,255,0.14)";
  const strokeSoft = "rgba(255,255,255,0.07)";

  return (
    <AbsoluteFill style={{ background: s.bg }}>
      {/* faint motion — shape drifts very slowly (transform only, cheap) */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {s.motif === "circles" && (
          <>
            <circle cx={width * 0.82} cy={height * 0.2} r={240} fill="none" stroke={stroke} strokeWidth={1.5} />
            <circle cx={width * 0.82} cy={height * 0.2} r={300} fill="none" stroke={strokeSoft} strokeWidth={1} />
            <circle cx={width * 0.14} cy={height * 0.78} r={90} fill="none" stroke={strokeSoft} strokeWidth={1} />
          </>
        )}
        {s.motif === "plus" && (
          <>
            {[0.12, 0.22, 0.5, 0.72, 0.88].map((x, i) => (
              <g key={i} transform={`translate(${width * x}, ${height * (0.2 + i * 0.16)})`} stroke={stroke} strokeWidth={2}>
                <line x1={-13} y1={0} x2={13} y2={0} />
                <line x1={0} y1={-13} x2={0} y2={13} />
              </g>
            ))}
          </>
        )}
        {s.motif === "barcode" && (
          <>
            {[30, 70, 110, 150, 190, 230, 270, 310].map((x, i) => (
              <rect key={i} x={x} y={height * 0.12} width={i % 3 === 0 ? 6 : 3} height={height * 0.3} fill={stroke} />
            ))}
            {[width - 330, width - 290, width - 250, width - 210, width - 170, width - 130, width - 90].map((x, i) => (
              <rect key={i} x={x} y={height * 0.62} width={i % 2 === 0 ? 5 : 2} height={height * 0.26} fill={stroke} />
            ))}
          </>
        )}
        {s.motif === "rings" && (
          <>
            <circle cx={width * 0.5} cy={height * 0.34} r={150} fill="none" stroke={stroke} strokeWidth={2} />
            <circle cx={width * 0.5} cy={height * 0.34} r={120} fill="none" stroke={strokeSoft} strokeWidth={1.5} />
            <circle cx={width * 0.5} cy={height * 0.34} r={90} fill="none" stroke={stroke} strokeWidth={1} />
          </>
        )}
        {s.motif === "diag" && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={width * 0.1 + i * 46} y1={height * 0.05} x2={width * 0.25 + i * 46} y2={height * 0.45} stroke={strokeSoft} strokeWidth={2} />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={width * 0.68 + i * 40} y1={height * 0.55} x2={width * 0.8 + i * 40} y2={height * 0.95} stroke={stroke} strokeWidth={2} />
            ))}
          </>
        )}
      </svg>
      {/* slow drift to keep the frame alive */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${Math.sin(t * 0.8) * 10}px)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/** Flat card (solid white — inversion against the black background). */
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
        padding: "30px 34px",
        borderRadius: 20,
        background: "#f2f2f4",
        transform: `translateY(${(1 - pop) * 26}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Karaoke caption: active sentence full-black, others grey (on white card). */
export const CaptionKaraoke: React.FC<{
  sentences: { w: string; start: number; end: number }[];
  size?: number;
}> = ({ sentences, size = 46 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps;

  let activeIdx = 0;
  for (let i = 0; i < sentences.length; i++) {
    if (now >= sentences[i].start) { activeIdx = i; break; }
  }

  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.3,
        color: "#000000",
        letterSpacing: "-0.01em",
      }}
    >
      {sentences.map((s, i) => (
        <span key={i} style={{ opacity: i === activeIdx ? 1 : 0.35 }}>
          {s.w}
          {i < sentences.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

/** Big display title, word-by-word kinetic entrance, accent = inverted block. */
export const KineticTitle: React.FC<{
  text: string;
  size?: number;
  accentIndex?: number;
  accentColor?: string;
  position?: "top" | "center";
}> = ({ text, size = 88, accentIndex = -1, position = "top" }) => {
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
            marginRight: "0.18em",
            marginBottom: "0.08em",
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: size,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: i === accentIndex ? "#000000" : "#ffffff",
            background: i === accentIndex ? "#ffffff" : "transparent",
            padding: i === accentIndex ? "0 0.1em 0.02em" : "0",
            borderRadius: 10,
            opacity: interpolate(frame, [i * dur, i * dur + dur * 0.5], [0, 1], {
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(frame, [i * dur, i * dur + dur * 0.6], [26, 0], {
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};

/** Huge stat with a thin rectangle frame behind (flat, editorial). */
export const StatCounter: React.FC<{
  value: string;
  label: string;
}> = ({ value, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  return (
    <div
      style={{
        position: "absolute",
        left: "10%",
        right: "10%",
        top: "26%",
        textAlign: "center",
        transform: `scale(${0.85 + pop * 0.15})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-28px -40px",
          border: "2px solid rgba(255,255,255,0.85)",
          borderRadius: 16,
          transform: `rotate(${(1 - pop) * 6}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-16px -24px",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 12,
          transform: `translate(${(1 - pop) * 10}px, ${(1 - pop) * 10}px)`,
        }}
      />
      <div
        style={{
          position: "relative",
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 134,
          color: "#ffffff",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </div>
      <div
        style={{
          position: "relative",
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 34,
          color: "rgba(255,255,255,0.85)",
          marginTop: 22,
          lineHeight: 1.3,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Top-left scene label (flat outline pill). */
export const BrandTag: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      position: "absolute",
      left: "6%",
      top: "6%",
      padding: "10px 22px",
      borderRadius: 999,
      border: "2px solid #ffffff",
      color: "#ffffff",
      fontSize: 28,
      fontWeight: 700,
      fontFamily: FONT_BODY,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      background: "transparent",
    }}
  >
    {label}
  </div>
);

/** Bottom progress bar — solid white fill on faint track. */
export const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, total], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        bottom: "6%",
        height: 7,
        borderRadius: 99,
        background: "rgba(255,255,255,0.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 99,
          background: "#ffffff",
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
  const y = Math.sin(t * 1.4) * 12;
  const scale = 1 + Math.sin(t * 0.8) * 0.012;
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};