import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { FONT_DISPLAY, FONT_BODY } from "./parts";

/* ═══════════════════════════════════════════════════════════════════════
   REUSABLE MONO ASSETS — animated visual building blocks.
   All monochrome flat, transform/opacity only (no blur/SVG filters → fast
   software render). Each is a self-contained component sized to fit the
   "asset zone" of a scene (typically placed above the caption card).

   PITFALL (verified): a flex-row container whose children use `flex:1`
   collapses to width 0 when it is itself a horizontal flex item (intrinsic
   width = sum of flex-basis:0 items = 0). Always give root wrappers an
   explicit width so assets render regardless of parent layout.
   ═══════════════════════════════════════════════════════════════════════ */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Growing bar chart — editorial "growth" visual. */
export const ChartBars: React.FC<{ bars?: number; delay?: number }> = ({ bars = 5, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const heights = [0.42, 0.66, 0.5, 0.82, 0.62, 0.92, 0.72, 0.55, 0.88, 0.6];
  const MAX_H = 180;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: MAX_H, width: "100%" }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = heights[(i + Math.floor(delay)) % heights.length];
        const grow = interpolate(frame, [delay + i * 3, delay + i * 3 + 12], [0.05, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const px = Math.max(2, Math.round(h * MAX_H * grow));
        return (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 40,
              height: px,
              background: i % 2 === 0 ? "#ffffff" : "rgba(255,255,255,0.5)",
              borderRadius: 6,
            }}
          />
        );
      })}
    </div>
  );
};

/** Line chart that draws itself left→right (clip-width animation). */
export const ChartLine: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [delay, delay + fps * 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg width={520} height={320} viewBox="0 0 520 320">
      {[60, 140, 220].map((y) => (
        <line key={y} x1={20} y1={y} x2={500} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      ))}
      <path
        d="M0 280 C 50 260, 90 200, 130 210 S 220 130, 260 150 S 350 60, 390 80 S 470 30, 520 40"
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* reveal mask */}
      <rect x={0} y={0} width={520 * (1 - p)} height={320} fill="#000" />
      <circle cx={520} cy={40} r={7 + Math.sin(frame / 6) * 3} fill="#ffffff" opacity={p} />
    </svg>
  );
};

/** Ring/donut progress (percent). */
export const RingProgress: React.FC<{ pct?: number; size?: number; delay?: number }> = ({ pct = 0.72, size = 220, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 60 } });
  const r = 80;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, pct * p));
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <circle cx={100} cy={100} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={14} />
      <circle
        cx={100} cy={100} r={r} fill="none" stroke="#ffffff" strokeWidth={14} strokeLinecap="round"
        strokeDasharray={`${c * filled} ${c}`}
        transform="rotate(-90 100 100)"
      />
      <text x={100} y={112} textAnchor="middle" fill="#fff" fontSize={52} fontFamily={FONT_DISPLAY} fontWeight={800}>
        {Math.round(filled * 100)}
        <tspan fontSize={30} fill="rgba(255,255,255,0.7)">%</tspan>
      </text>
    </svg>
  );
};

/** Gauge with sweeping needle. */
export const Gauge: React.FC<{ value?: number; label?: string; delay?: number }> = ({ value = 0.62, label = "ACCURACY", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 16, stiffness: 70 } });
  const angle = -90 + 180 * value * v; // -90°..+90°
  return (
    <svg width={400} height={260} viewBox="0 0 400 260">
      <path d="M 30 220 A 170 170 0 0 1 370 220" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={16} strokeLinecap="round" />
      <path
        d="M 30 220 A 170 170 0 0 1 370 220"
        fill="none" stroke="#ffffff" strokeWidth={16} strokeLinecap="round"
        pathLength={1} strokeDasharray={value * v} strokeDashoffset={0}
      />
      <g transform={`rotate(${angle} 200 220)`}>
        <line x1={200} y1={220} x2={200} y2={70} stroke="#ffffff" strokeWidth={6} strokeLinecap="round" />
        <circle cx={200} cy={70} r={8} fill="#fff" />
      </g>
      <circle cx={200} cy={220} r={14} fill="#fff" />
      <text x={200} y={150} textAnchor="middle" fill="#fff" fontSize={40} fontFamily={MONO}>
        {Math.round(value * 100)}%
      </text>
      <text x={200} y={250} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={26} fontFamily={FONT_BODY} fontWeight={700} letterSpacing="0.2em">
        {label}
      </text>
    </svg>
  );
};

/** Scrolling ticker tape (endless marquee text). */
export const TickerTape: React.FC<{ text: string; speed?: number }> = ({ text, speed = 90 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const offset = (t * speed) % 50; // percent
  const doubled = `${text}   •   ${text}   •   ${text}`;
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", borderTop: "2px solid rgba(255,255,255,0.5)", borderBottom: "2px solid rgba(255,255,255,0.5)", padding: "14px 0" }}>
      <div
        style={{
          display: "inline-block",
          transform: `translateX(-${offset}%)`,
          fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 36, letterSpacing: "0.06em",
          color: "#fff", textTransform: "uppercase",
        }}
      >
        {doubled}
        {doubled}
      </div>
    </div>
  );
};

/** Big countdown / counter (rolling digits). */
export const Countdown: React.FC<{ end?: number; from?: number; delay?: number }> = ({ end = 3, from = 5, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - delay) / fps;
  const val = Math.max(end, Math.round(from - t));
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 240, lineHeight: 1, color: "#fff" }}>{val}</div>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 30, letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)", marginTop: 10 }}>SECONDS</div>
    </div>
  );
};

/** Node graph + data pulse traveling an edge (AI/workflow vibe). */
export const NodeFlow: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - delay) / fps;
  const pulse = (t % 1.4) / 1.4;
  const nodes = [
    { x: 60, y: 160 },
    { x: 200, y: 60 },
    { x: 200, y: 260 },
    { x: 350, y: 160 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  return (
    <svg width={420} height={320} viewBox="0 0 420 320">
      {edges.map(([a, b], i) => {
        const x1 = nodes[a].x, y1 = nodes[a].y, x2 = nodes[b].x, y2 = nodes[b].y;
        // pulse position
        const px = x1 + (x2 - x1) * pulse;
        const py = y1 + (y2 - y1) * pulse;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
            <circle cx={px} cy={py} r={6} fill="#fff" opacity={0.9} />
          </g>
        );
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x - 24} y={n.y - 24} width={48} height={48} rx={12} fill="none" stroke="#fff" strokeWidth={3} />
          <circle cx={n.x} cy={n.y} r={5} fill="#fff" />
        </g>
      ))}
    </svg>
  );
};

/** Pulse bars — audio-equalizer energy. */
export const PulseBars: React.FC<{ bars?: number; delay?: number }> = ({ bars = 12, delay = 0 }) => {
  const frame = useCurrentFrame();
  const t = (frame - delay) / 60;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 220 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const base = 0.25 + 0.3 * Math.abs(Math.sin(i * 1.7 + t * 4));
        return (
          <div
            key={i}
            style={{
              width: 16, height: `${base * 100}%`, background: "#ffffff", borderRadius: 4,
              transform: `scaleY(${0.4 + 0.6 * Math.abs(Math.sin(i * 1.3 + t * 3.2))})`,
              transformOrigin: "center",
            }}
          />
        );
      })}
    </div>
  );
};

/** Animated checklist — boxes tick one by one. */
export const Checklist: React.FC<{ items?: string[]; delay?: number }> = ({ items = ["PLAN", "BUILD", "SHIP"], delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {items.map((it, i) => {
        const p = spring({ frame: Math.max(0, frame - delay - i * 14), fps, config: { damping: 16, stiffness: 100 } });
        const done = p > 0.35;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, opacity: Math.max(0, Math.min(1, p * 1.4)) }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: 12,
                border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#fff" : "transparent",
              }}
            >
              {done && <svg width={30} height={30} viewBox="0 0 30 30"><path d="M7 16 L13 22 L23 9" stroke="#000" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 34, letterSpacing: "0.08em", color: "#fff" }}>
              {it}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** HUD corner frame + crosshair center (tech overlay asset). */
export const HudFrame: React.FC<{ label?: string }> = ({ label = "SYSTEM" }) => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const c = 36;
  const gap = 26;
  return (
    <svg width={700} height={440} viewBox="0 0 700 440">
      {[
        `M ${gap} ${gap} L ${gap + c} ${gap} L ${gap + c} ${gap + c / 2} M ${gap} ${gap} L ${gap} ${gap + c} L ${gap + c / 2} ${gap + c}`,
        `M ${700 - gap} ${gap} L ${700 - gap - c} ${gap} L ${700 - gap - c} ${gap + c / 2} M ${700 - gap} ${gap} L ${700 - gap} ${gap + c} L ${700 - gap - c / 2} ${gap + c}`,
        `M ${gap} ${440 - gap} L ${gap + c} ${440 - gap} L ${gap + c} ${440 - gap - c / 2} M ${gap} ${440 - gap} L ${gap} ${440 - gap - c} L ${gap + c / 2} ${440 - gap - c}`,
        `M ${700 - gap} ${440 - gap} L ${700 - gap - c} ${440 - gap} L ${700 - gap - c} ${440 - gap - c / 2} M ${700 - gap} ${440 - gap} L ${700 - gap} ${440 - gap - c} L ${700 - gap - c / 2} ${440 - gap - c}`,
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
      ))}
      {/* scanning line */}
      <line x1={60} y1={60 + ((t * 90) % 320)} x2={640} y2={60 + ((t * 90) % 320)} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      {/* center crosshair */}
      <circle cx={350} cy={220} r={40 + Math.sin(t * 2) * 6} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
      <line x1={340} y1={220} x2={360} y2={220} stroke="#fff" strokeWidth={3} />
      <line x1={350} y1={210} x2={350} y2={230} stroke="#fff" strokeWidth={3} />
      <text x={350} y={412} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={26} fontFamily={MONO} letterSpacing="0.3em">
        {label}
      </text>
    </svg>
  );
};

/** Percent stat block — big value + thin bar (editorial). */
export const StatBlock: React.FC<{ value: string; sub: string; delay?: number }> = ({ value, sub, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 80 } });
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 170, lineHeight: 1, color: "#fff", transform: `scale(${0.8 + pop * 0.2})` }}>
        {value}
      </div>
      <div style={{ margin: "18px auto 0", width: "70%", height: 8, borderRadius: 99, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
        <div style={{ width: `${pop * 100}%`, height: "100%", background: "#fff", borderRadius: 99 }} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 30, color: "rgba(255,255,255,0.8)", marginTop: 18, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {sub}
      </div>
    </div>
  );
};