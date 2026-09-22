import React from "react";
import { AbsoluteFill } from "remotion";
import { CaptionLine, SvgBackground, ProgressBar, BrandTag } from "./parts";

/** A single timed segment: one text card rendered for `duration` frames. */
const Segment: React.FC<{
  text: string;
  highlight?: string;
  label?: string;
  size: number;
  from: number;
  duration: number;
}> = ({ text, highlight, label, size, from, duration }) => (
  <AbsoluteFill>
    <SvgBackground />
    {label ? <BrandTag label={label} /> : null}
    <CaptionLine text={text} highlight={highlight} size={size} />
    <ProgressBar total={duration} />
    {/* current time indicator */}
    <div
      style={{
        position: "absolute",
        right: "6%",
        bottom: "7.5%",
        color: "rgba(255,255,255,0.4)",
        fontSize: 22,
        fontFamily: "monospace",
        letterSpacing: "0.1em",
      }}
    >
      {(from / 30).toFixed(2)}s
    </div>
  </AbsoluteFill>
);

/** Composition props driven by the worker (JSON). */
export const ShortsVideo: React.FC<{
  segments: {
    text: string;
    duration: number; // frames
    highlight?: string;
    label?: string;
    size?: number;
  }[];
  from?: number;
  duration?: number;
}> = ({ segments }) => {
  const baseSize = 68;
  let acc = 0;
  return (
    <>
      {segments.map((s, i) => {
        const from = acc;
        acc += s.duration;
        return (
          <Segment
            key={i}
            text={s.text}
            highlight={s.highlight}
            label={s.label}
            size={s.size ?? baseSize}
            from={from}
            duration={s.duration}
          />
        );
      })}
    </>
  );
};

export const useTotalDuration = (segments: { duration: number }[]) =>
  segments.reduce((a, s) => a + s.duration, 0);