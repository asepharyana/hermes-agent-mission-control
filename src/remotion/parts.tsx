import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from "remotion";

/** Animated diagonal gradient background + soft floating blobs. */
export const SvgBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drift = (speed: number, amp: number) =>
    Math.sin((frame / 60) * speed) * amp;

  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, #0b1020 0%, #141a33 45%, #1b1030 100%)`,
        }}
      />
      {/* floating gradient blobs (radial gradients are pre-softened — no blur filter) */}
      <div
        style={{
          position: "absolute",
          width: width * 0.9,
          height: width * 0.9,
          left: width * 0.1 + drift(1, 60),
          top: height * 0.05 + drift(0.7, 40),
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0.18) 40%, transparent 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.7,
          height: width * 0.7,
          right: -width * 0.15 + drift(1.3, 50),
          bottom: height * 0.18 + drift(0.9, 30),
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.28) 0%, rgba(236,72,153,0.14) 40%, transparent 68%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Big bold caption line with spring-in + fade + word-by-word pop. */
export const CaptionLine: React.FC<{
  text: string;
  highlight?: string;
  size: number;
}> = ({ text, highlight, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const words = text.split(" ");
  const charDur = Math.max(2, Math.floor(fps * 0.13));

  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        top: "18%",
        transform: `translateY(${(1 - pop) * 30}px) scale(${0.96 + pop * 0.04})`,
        opacity: enter,
        textAlign: "left",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.92)",
          fontSize: size,
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
          textShadow: "0 4px 24px rgba(0,0,0,0.45)",
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              opacity: interpolate(
                frame,
                [i * charDur, i * charDur + charDur * 0.6],
                [0, 1],
                { extrapolateRight: "clamp" }
              ),
              display: "inline-block",
              marginRight: "0.28em",
              color:
                highlight && w.toLowerCase().includes(highlight.toLowerCase())
                  ? "#a5b4fc"
                  : undefined,
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Bottom progress bar that fills over the segment duration. */
export const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, total], [0, 100], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: "6%",
        right: "6%",
        bottom: "7%",
        height: 7,
        borderRadius: 99,
        background: "rgba(255,255,255,0.14)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 99,
          background: "linear-gradient(90deg,#6366f1,#ec4899)",
        }}
      />
    </div>
  );
};

/** Small brand tag. */
export const BrandTag: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      position: "absolute",
      left: "6%",
      top: "7%",
      padding: "8px 18px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.16)",
      color: "rgba(255,255,255,0.75)",
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: "0.06em",
      fontFamily: "Inter, system-ui, sans-serif",
    }}
  >
    {label}
  </div>
);