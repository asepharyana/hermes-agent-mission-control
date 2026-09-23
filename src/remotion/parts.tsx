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
  { bg: "#0c0c10", motif: "grid" },       // blueprint grid
  { bg: "#141418", motif: "dots" },       // dot matrix
  { bg: "#0e0e12", motif: "waves" },      // sine waves
  { bg: "#131317", motif: "stars" },      // rotating asterisks
  { bg: "#111115", motif: "zigzag" },     // zigzag bands
  { bg: "#0b0b0e", motif: "brackets" },   // blueprint corner frame
];

/** Flat mono background: solid color + faint white SVG motif per scene.
 *  Each motif animates with its own cheap (transform/opacity) motion. */
export const SvgBackground: React.FC<{ variant?: number }> = ({ variant = 0 }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / 60;
  const s = SCENES[variant % SCENES.length];
  const stroke = "rgba(255,255,255,0.15)";
  const strokeSoft = "rgba(255,255,255,0.07)";
  const W = width;
  const H = height;

  return (
    <AbsoluteFill style={{ background: s.bg }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
      >
        {s.motif === "circles" && (
          <>
            <g transform={`scale(${1 + Math.sin(t * 1.6) * 0.05}) translate(${W * (0.82 - 0.82 * Math.sin(t * 1.6) * 0.05)}, ${H * (0.2 - 0.2 * Math.sin(t * 1.6) * 0.05)})`}>
              <circle cx={0} cy={0} r={240} fill="none" stroke={stroke} strokeWidth={1.5} />
              <circle cx={0} cy={0} r={300} fill="none" stroke={strokeSoft} strokeWidth={1} />
            </g>
            <circle cx={W * 0.14} cy={H * 0.78} r={90} fill="none" stroke={strokeSoft} strokeWidth={1} />
          </>
        )}
        {s.motif === "plus" && (
          <>
            {[0.12, 0.22, 0.5, 0.72, 0.88].map((x, i) => (
              <g key={i} transform={`translate(${W * x}, ${H * (0.2 + i * 0.16) + Math.sin(t + i * 1.2) * 14})`} stroke={stroke} strokeWidth={2} opacity={0.55 + 0.45 * Math.sin(t + i * 1.2)}>
                <line x1={-13} y1={0} x2={13} y2={0} />
                <line x1={0} y1={-13} x2={0} y2={13} />
              </g>
            ))}
          </>
        )}
        {s.motif === "barcode" && (
          <>
            {[30, 70, 110, 150, 190, 230, 270, 310].map((x, i) => (
              <rect key={i} x={x} y={H * 0.12} width={i % 3 === 0 ? 6 : 3} height={H * 0.3} fill={stroke} opacity={0.5 + 0.5 * Math.sin(t * 2 + i * 0.9)} />
            ))}
            {[W - 330, W - 290, W - 250, W - 210, W - 170, W - 130, W - 90].map((x, i) => (
              <rect key={i} x={x} y={H * 0.62} width={i % 2 === 0 ? 5 : 2} height={H * 0.26} fill={stroke} opacity={0.4 + 0.6 * Math.sin(t * 2.2 + i * 1.1)} />
            ))}
          </>
        )}
        {s.motif === "rings" && (
          <g transform={`scale(${1 + Math.sin(t * 0.9) * 0.04}) translate(${W * 0.5 * (1 - (1 + Math.sin(t * 0.9) * 0.04))}, ${H * 0.34 * (1 - (1 + Math.sin(t * 0.9) * 0.04))})`}>
            <circle cx={W * 0.5} cy={H * 0.34} r={150} fill="none" stroke={stroke} strokeWidth={2} />
            <circle cx={W * 0.5} cy={H * 0.34} r={120} fill="none" stroke={strokeSoft} strokeWidth={1.5} />
            <circle cx={W * 0.5} cy={H * 0.34} r={90} fill="none" stroke={stroke} strokeWidth={1} />
          </g>
        )}
        {s.motif === "diag" && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={W * 0.1 + i * 46 - ((t * 14) % 46)} y1={H * 0.05} x2={W * 0.25 + i * 46 - ((t * 14) % 46)} y2={H * 0.45} stroke={strokeSoft} strokeWidth={2} />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={W * 0.68 + i * 40 + ((t * 10) % 40)} y1={H * 0.55} x2={W * 0.8 + i * 40 + ((t * 10) % 40)} y2={H * 0.95} stroke={stroke} strokeWidth={2} />
            ))}
          </>
        )}
        {s.motif === "grid" && (
          <>
            {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((y, i) => (
              <line key={i} x1={W * 0.06} y1={H * y} x2={W * 0.94} y2={H * y} stroke={strokeSoft} strokeWidth={1} />
            ))}
            {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((x, i) => (
              <line key={i} x1={W * x} y1={H * 0.06} x2={W * x} y2={H * 0.94} stroke={strokeSoft} strokeWidth={1} />
            ))}
            <line x1={W * 0.06} y1={H * (0.15 + 0.15 * ((t * 0.4) % 1))} x2={W * 0.94} y2={H * (0.15 + 0.15 * ((t * 0.4) % 1))} stroke={stroke} strokeWidth={2} />
          </>
        )}
        {s.motif === "dots" && (
          <>
            {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((x, i) => (
              <g key={i}>
                {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((y, j) => (
                  <circle key={j} cx={W * x} cy={H * y} r={2.6} fill={stroke} opacity={0.35 + 0.65 * Math.sin(t * 1.4 + i * 1.3 + j * 0.8)} />
                ))}
              </g>
            ))}
          </>
        )}
        {s.motif === "waves" && (
          <>
            <polyline
              points={`${W * 0.02},${H * 0.3} ${W * 0.1},${H * (0.28 + Math.sin(t) * 0.03)} ${W * 0.25},${H * (0.32 + Math.sin(t + 0.8) * 0.03)} ${W * 0.4},${H * (0.28 + Math.sin(t + 1.6) * 0.03)} ${W * 0.55},${H * (0.32 + Math.sin(t + 2.4) * 0.03)} ${W * 0.7},${H * (0.28 + Math.sin(t + 3.2) * 0.03)} ${W * 0.85},${H * (0.32 + Math.sin(t + 4) * 0.03)} ${W * 0.98},${H * 0.3}`}
              fill="none" stroke={stroke} strokeWidth={2}
            />
            <polyline
              points={`${W * 0.02},${H * 0.72} ${W * 0.15},${H * (0.74 + Math.sin(t * 1.3) * 0.03)} ${W * 0.3},${H * (0.7 + Math.sin(t * 1.3 + 1) * 0.03)} ${W * 0.5},${H * (0.74 + Math.sin(t * 1.3 + 2) * 0.03)} ${W * 0.65},${H * (0.7 + Math.sin(t * 1.3 + 3) * 0.03)} ${W * 0.8},${H * (0.74 + Math.sin(t * 1.3 + 4) * 0.03)} ${W * 0.98},${H * 0.72}`}
              fill="none" stroke={strokeSoft} strokeWidth={1.5}
            />
          </>
        )}
        {s.motif === "stars" && (
          <>
            {[
              { x: 0.16, y: 0.2, s: 30, ph: 0 },
              { x: 0.8, y: 0.28, s: 22, ph: 1.4 },
              { x: 0.3, y: 0.72, s: 26, ph: 2.6 },
              { x: 0.72, y: 0.8, s: 18, ph: 3.8 },
              { x: 0.88, y: 0.62, s: 34, ph: 0.7 },
            ].map((st, i) => (
              <g key={i} transform={`translate(${W * st.x}, ${H * st.y}) rotate(${t * 16 + st.ph * 40})`} stroke={stroke} strokeWidth={2}>
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <line key={k} x1={0} y1={-st.s * 0.5} x2={0} y2={st.s * 0.5} transform={`rotate(${k * 30})`} />
                ))}
              </g>
            ))}
          </>
        )}
        {s.motif === "zigzag" && (
          <>
            {[0.14, 0.3, 0.46].map((y, i) => (
              <polyline
                key={i}
                points={`${-40 + ((t * 26) % 80)},${H * y} ${20 + ((t * 26) % 80)},${H * (y - 0.05)} ${80 + ((t * 26) % 80)},${H * y} ${140 + ((t * 26) % 80)},${H * (y - 0.05)} ${200 + ((t * 26) % 80)},${H * y} ${260 + ((t * 26) % 80)},${H * (y - 0.05)} ${320 + ((t * 26) % 80)},${H * y} ${380 + ((t * 26) % 80)},${H * (y - 0.05)} ${440 + ((t * 26) % 80)},${H * y} ${500 + ((t * 26) % 80)},${H * (y - 0.05)} ${560 + ((t * 26) % 80)},${H * y}`}
                fill="none" stroke={i === 1 ? stroke : strokeSoft} strokeWidth={2}
              />
            ))}
          </>
        )}
        {s.motif === "brackets" && (
          <>
            <g transform={`translate(${Math.sin(t * 0.6) * 6}, ${Math.cos(t * 0.6) * 6})`} stroke={stroke} strokeWidth={3} fill="none">
              <path d={`M ${W * 0.04} ${H * 0.9} L ${W * 0.04} ${H * 0.08} L ${W * 0.1} ${H * 0.08}`} />
              <path d={`M ${W * 0.96} ${H * 0.1} L ${W * 0.96} ${H * 0.92} L ${W * 0.9} ${H * 0.92}`} />
            </g>
            <circle cx={W * 0.5} cy={H * 0.5} r={Math.abs(Math.sin(t * 0.5)) * 90} fill="none" stroke={strokeSoft} strokeWidth={1} />
            <circle cx={W * 0.5} cy={H * 0.5} r={Math.max(0, Math.sin(t * 0.5 + Math.PI)) * 90} fill="none" stroke={strokeSoft} strokeWidth={1} />
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

/* ═══════════════════════════════════════════════════════════════════════
   CREATIVE SCENES — visual variety beyond the caption card.
   All monochrome flat, transform/opacity only (no blur/SVG filters).
   ═══════════════════════════════════════════════════════════════════════ */

/** Monospace terminal typeface. */
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Line icons drawn with strokes (animate in via opacity/offset). */
export const LineIcon: React.FC<{
  kind: "check" | "cross" | "node" | "bolt";
  size?: number;
  delay?: number;
}> = ({ kind, size = 64, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
  const s = size;
  const stroke = "currentColor";
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 64"
      style={{ color: "#ffffff", opacity: pop, transform: `scale(${0.7 + pop * 0.3})` }}
    >
      {kind === "check" && (
        <>
          <circle cx={32} cy={32} r={27} fill="none" stroke={stroke} strokeWidth={4} />
          <path d="M20 33 L28 41 L45 23" fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === "cross" && (
        <>
          <circle cx={32} cy={32} r={27} fill="none" stroke={stroke} strokeWidth={4} />
          <path d="M23 23 L41 41 M41 23 L23 41" fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" />
        </>
      )}
      {kind === "node" && (
        <>
          <circle cx={16} cy={20} r={7} fill="none" stroke={stroke} strokeWidth={3} />
          <circle cx={36} cy={44} r={7} fill="none" stroke={stroke} strokeWidth={3} />
          <circle cx={50} cy={16} r={7} fill="none" stroke={stroke} strokeWidth={3} />
          <path d="M20 25 L32 38 M32 38 L44 22 M22 18 L44 16" fill="none" stroke={stroke} strokeWidth={3} />
        </>
      )}
      {kind === "bolt" && (
        <path d="M36 8 L16 36 L30 36 L26 56 L48 26 L33 26 Z" fill="none" stroke={stroke} strokeWidth={4} strokeLinejoin="round" />
      )}
    </svg>
  );
};

/** Terminal scene — "$" prompt + typed commands, blinking cursor (AI-agent vibe). */
export const TerminalScene: React.FC<{ text: string; size?: number }> = ({ text, size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Split into command line(s) + output lines (roughly 4-6 words each)
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().split(" ").length > 5) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur.trim());
  const cmd = lines[0] || "$ agent --fix";
  const output = lines.slice(1);
  // typing effect for command
  const typeDur = Math.max(6, Math.floor(fps * 0.8)); // frames to type full command
  const chars = Math.min(cmd.length, Math.floor((frame / typeDur) * cmd.length));
  const typed = cmd.slice(0, chars);
  const blink = frame % (fps * 1.1) < fps * 0.55;
  const pop = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  return (
    <div
      style={{
        position: "absolute",
        left: "7%",
        right: "7%",
        top: "24%",
        background: "#000000",
        border: "2px solid #ffffff",
        borderRadius: 18,
        padding: "34px 30px",
        fontFamily: FONT_MONO,
        transform: `translateY(${(1 - pop) * 24}px)`,
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 99, border: "2px solid #fff", opacity: 1 - i * 0.25 }} />
        ))}
      </div>
      <div style={{ fontSize: size, color: "#ffffff", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
        <span style={{ color: "rgba(255,255,255,0.55)" }}>$ </span>
        {typed}
        <span style={{ opacity: blink ? 1 : 0, background: "#fff", color: "#000", padding: "0 3px", marginLeft: 2 }}>▌</span>
      </div>
      {output.map((l, i) => {
        const o = Math.max(0, Math.min(1, (frame - typeDur - i * 10) / 12));
        return (
          <div key={i} style={{ fontSize: size * 0.62, color: "rgba(255,255,255,0.78)", lineHeight: 1.5, opacity: o, marginTop: 12 }}>
            {l}
          </div>
        );
      })}
    </div>
  );
};

/** DON'T (✗) vs DO (✓) — split compare panel. */
export const CompareScene: React.FC<{ text: string; side: "bad" | "good"; size?: number }> = ({ text, side, size = 38 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const words = text.split(" ");
  const chunk = Math.max(3, Math.ceil(words.length / 2));
  const halves = [words.slice(0, chunk).join(" "), words.slice(chunk).join(" ")];
  const good = side === "good";
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        top: "26%",
        display: "flex",
        alignItems: "stretch",
        gap: 18,
        transform: `translateY(${(1 - pop) * 30}px)`,
      }}
    >
      <div
        style={{
          flex: 1,
          border: `2px solid ${good ? "rgba(255,255,255,0.35)" : "#ffffff"}`,
          borderRadius: 16,
          padding: "30px 22px",
          background: good ? "transparent" : "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: good ? 0.5 : 1,
        }}
      >
        <LineIcon kind="cross" size={52} />
        <div
          style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: "0.12em",
            color: good ? "#fff" : "#000",
          }}
        >
          DON'T
        </div>
      </div>
      <div style={{ alignSelf: "center", fontFamily: FONT_DISPLAY, fontSize: 44, color: "#fff" }}>→</div>
      <div
        style={{
          flex: 1.4,
          border: `2px solid ${good ? "#ffffff" : "rgba(255,255,255,0.35)"}`,
          borderRadius: 16,
          padding: "30px 22px",
          background: good ? "#ffffff" : "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: good ? 1 : 0.5,
        }}
      >
        <LineIcon kind="check" size={52} />
        <div
          style={{
            fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: "0.12em",
            color: good ? "#000" : "#fff",
          }}
        >
          DO THIS
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: -16,
          textAlign: "center",
        }}
      />
    </div>
  );
};

/** Numbered bullet list (for insights: "1. one idea 2. …") — animated per bullet. */
export const BulletScene: React.FC<{ text: string; size?: number }> = ({ text, size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const per = Math.max(3, Math.ceil(words.length / 3));
  const bullets = [
    words.slice(0, per).join(" "),
    words.slice(per, per * 2).join(" "),
    words.slice(per * 2).join(" "),
  ].filter(Boolean);
  return (
    <div
      style={{
        position: "absolute",
        left: "8%",
        right: "8%",
        top: "24%",
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      {bullets.map((b, i) => {
        const start = i * 10;
        const o = Math.max(0, Math.min(1, (frame - start) / 12));
        const y = (1 - o) * 30;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, opacity: o, transform: `translateY(${y}px)` }}>
            <div
              style={{
                width: 62, height: 62, borderRadius: 14, border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 32, color: "#fff",
                background: "#000",
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, fontFamily: FONT_BODY, fontWeight: 700, fontSize: size * 0.72, lineHeight: 1.35, color: "#ffffff" }}>
              {b}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Bang scene — one keyword bursts center-stage with radial rays (the twist). */
export const BangScene: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const keyword = words.length > 4 ? words.slice(0, 3).join(" ") : text;
  const rest = words.length > 4 ? words.slice(3).join(" ") : "";
  const boom = spring({ frame, fps, config: { damping: 12, stiffness: 90 } });
  const rays = 12;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "30%", textAlign: "center" }}>
      {/* radial rays */}
      <svg width={560} height={560} viewBox="0 0 560 560" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", opacity: 0.9 * boom }}>
        {Array.from({ length: rays }).map((_, i) => {
          const a = (i / rays) * Math.PI * 2;
          const x1 = 280 + Math.cos(a) * 90;
          const y1 = 280 + Math.sin(a) * 90;
          const x2 = 280 + Math.cos(a) * (240 + (i % 3) * 20);
          const y2 = 280 + Math.sin(a) * (240 + (i % 3) * 20);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />;
        })}
      </svg>
      <div
        style={{
          position: "relative",
          fontFamily: FONT_DISPLAY, fontWeight: 800,
          fontSize: 92, lineHeight: 1.05, letterSpacing: "-0.03em",
          color: "#ffffff",
          transform: `scale(${0.7 + boom * 0.3})`,
        }}
      >
        {keyword}
      </div>
      {rest && (
        <div
          style={{
            position: "relative",
            marginTop: 26, padding: "14px 30px", display: "inline-block",
            background: "#ffffff", color: "#000000", borderRadius: 12,
            fontFamily: FONT_BODY, fontWeight: 700, fontSize: 32,
            opacity: boom,
          }}
        >
          {rest}
        </div>
      )}
    </div>
  );
};

/** Compact karaoke caption strip — subtitle support below the big visual. */
export const MiniKaraoke: React.FC<{
  sentences: { w: string; start: number; end: number }[];
  size?: number;
}> = ({ sentences, size = 26 }) => {
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
        position: "absolute",
        left: "8%", right: "8%", bottom: "10.5%",
        textAlign: "center",
        fontFamily: FONT_BODY, fontWeight: 700, fontSize: size,
        lineHeight: 1.35, color: "rgba(255,255,255,0.92)",
        textShadow: "0 2px 0 rgba(0,0,0,0.9)",
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

/* ═══════════════════════════════════════════════════════════════════════
   SCENE ROUND 2 — 4 more creative scene types (mono flat).
   ═══════════════════════════════════════════════════════════════════════ */

/** Quote scene — oversized quotation mark + emphasized excerpt + attribution. */
export const QuoteScene: React.FC<{ text: string; size?: number }> = ({ text, size = 50 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 16, stiffness: 70 } });
  const words = text.split(" ");
  const quote = words.length > 8 ? words.slice(0, -3).join(" ") : text;
  const byline = words.length > 8 ? words.slice(-3).join(" ") : "";
  return (
    <div style={{ position: "absolute", left: "10%", right: "10%", top: "24%", textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 190, lineHeight: 0.6,
          color: "rgba(255,255,255,0.25)", transform: `translateY(${(1 - p) * 40}px)`,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.2,
          letterSpacing: "-0.02em", color: "#ffffff", marginTop: -20,
          opacity: p,
        }}
      >
        {quote}
      </div>
      {byline && (
        <div
          style={{
            marginTop: 26, display: "inline-block", borderTop: "2px solid rgba(255,255,255,0.6)",
            paddingTop: 14, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 26,
            color: "rgba(255,255,255,0.75)", letterSpacing: "0.12em", textTransform: "uppercase",
            opacity: p,
          }}
        >
          — {byline}
        </div>
      )}
    </div>
  );
};

/** Podium scene — 1-2-3 columns with the middle one elevated (ranking). */
export const PodiumScene: React.FC<{ text: string; size?: number }> = ({ text, size = 36 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const words = text.split(" ");
  const picks = words.length >= 3 ? [words[0], words[1], words[2]] : ["TOP", "3", "PICKS"];
  const heights = [200, 280, 150];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "26%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 30 }}>
      {picks.map((w, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: size,
              color: i === 1 ? "#000" : "#fff", textAlign: "center",
              transform: `translateY(${(1 - p) * 80}px)`, opacity: p,
              width: 210, lineHeight: 1.15,
            }}
          >
            {w}
          </div>
          <div
            style={{
              width: 210, height: 70 + (heights[i] - 70) * p,
              background: i === 1 ? "#fff" : "rgba(255,255,255,0.25)",
              border: "2px solid #fff", borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 44, color: i === 1 ? "#000" : "#fff",
            }}
          >
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Grid list — 2×2 keyword tiles popping in with check corners. */
export const GridListScene: React.FC<{ text: string; size?: number }> = ({ text, size = 34 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const tiles = words.length >= 4 ? words.slice(0, 4) : ["AGENT", text.slice(0, 12).toUpperCase(), "TOOLS", "MEMORY"];
  return (
    <div style={{ position: "absolute", left: "14%", right: "14%", top: "30%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {tiles.map((w, i) => {
        const p = spring({ frame: Math.max(0, frame - i * 6), fps, config: { damping: 16, stiffness: 100 } });
        const r = i % 2 === 0 ? 14 : 20;
        return (
          <div
            key={i}
            style={{
              border: "2px solid rgba(255,255,255,0.9)", borderRadius: 18,
              minHeight: 140, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: size,
              color: "#fff", textAlign: "center", padding: "0 14px",
              transform: `scale(${0.4 + p * 0.6}) rotate(${(r - 14) * (1 - p)}deg)`,
              opacity: p,
            }}
          >
            {w}
          </div>
        );
      })}
    </div>
  );
};

/** Scoreboard — Q&A panel (question highlighted, answer slides in). */
export const ScoreboardScene: React.FC<{ text: string; size?: number }> = ({ text, size = 38 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 16, stiffness: 75 } });
  const words = text.split(" ");
  const q = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const a = words.slice(Math.ceil(words.length / 2)).join(" ");
  return (
    <div style={{ position: "absolute", left: "10%", right: "10%", top: "26%" }}>
      <div
        style={{
          background: "#fff", color: "#000", borderRadius: 18, padding: "26px 34px",
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.2,
          transform: `translateY(${(1 - p) * 60}px)`, opacity: p,
        }}
      >
        <span style={{ opacity: 0.5, fontSize: size - 14, marginRight: 14 }}>Q</span>
        {q}
      </div>
      <div
        style={{
          marginTop: 22, border: "2px solid #fff", borderRadius: 18, padding: "26px 34px",
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: size - 6, lineHeight: 1.2,
          color: "#fff", transform: `translateY(${(1 - p) * 60}px)`, opacity: Math.max(0, p * 2 - 1),
        }}
      >
        <span style={{ opacity: 0.6, fontSize: size - 14, marginRight: 14 }}>A</span>
        {a}
      </div>
    </div>
  );
};