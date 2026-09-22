import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { FONT_BODY, FONT_DISPLAY } from "./parts";

/* ─────────────────────────────────────────────────────────────────────────
   Source-content cards — mono, flat, editorial.
   Rendered as scenes between/around TTS caption scenes so the video shows
   the actual tweet/thread/news, not just subtitles.
   ───────────────────────────────────────────────────────────────────────── */

const WHITE = "#ffffff";
const BLACK = "#000000";
const GREY = "#8a8a90";

function slug(s: string, n = 12): string {
  return (s || "").length > n ? s.slice(0, n - 1) + "…" : s;
}

function splitLines(text: string, perLine = 34): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > perLine) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 7); // cap
}

/** Staggered fade-up for card text blocks. */
function useStagger(total: number, step = 6) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  return (i: number) => {
    const o = spring({ frame: frame - i * step, fps, config: { damping: 16, stiffness: 90 }, delay: 0 });
    return {
      opacity: Math.max(0, Math.min(1, frame - i * step) / 8),
      transform: `translateY(${(1 - o) * 22}px)`,
    };
  };
}

/** ── Tweet / Thread card ─────────────────────────────────────────────── */
export const TweetCard: React.FC<{
  handle: string;
  name: string;
  text: string;
  likes?: number | null;
  retweets?: number | null;
  replies?: number | null;
  views?: number | null;
}> = ({ handle, name, text, likes, retweets, replies, views }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const count = (v?: number | null) => (v == null ? null : formatCount(v));

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 7%",
      }}
    >
      <div
        style={{
          width: "100%",
          background: WHITE,
          borderRadius: 28,
          padding: "42px 44px",
          transform: `translateY(${(1 - pop) * 30}px) scale(${0.94 + pop * 0.06})`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* header: avatar initial + name/handle */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: 40,
              background: BLACK,
              color: WHITE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              fontFamily: FONT_DISPLAY,
              marginRight: 22,
            }}
          >
            {(name || handle || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 40, color: BLACK, lineHeight: 1.1 }}>
              {slug(name, 22)}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 30, color: GREY }}>
              @{handle}
            </div>
          </div>
        </div>

        {/* tweet body */}
        <div
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 46,
            lineHeight: 1.35,
            color: BLACK,
            letterSpacing: "-0.01em",
            marginBottom: 34,
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>

        {/* stats row */}
        <div style={{ display: "flex", gap: 40, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 30, color: GREY }}>
          {count(views) !== null && <span>▶ {count(views)}</span>}
          {count(replies) !== null && <span>↩ {count(replies)}</span>}
          {count(retweets) !== null && <span>↻ {count(retweets)}</span>}
          {count(likes) !== null && <span>♥ {count(likes)}</span>}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ── Thread card (multiple tweets stacked) ───────────────────────────── */
export const ThreadCard: React.FC<{
  handle: string;
  tweets: { text: string; name?: string }[];
}> = ({ handle, tweets }) => {
  const anim = useStagger(tweets.length);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 6%" }}>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 38,
          color: WHITE,
          marginBottom: 24,
          letterSpacing: "0.02em",
        }}
      >
        🧵 @{handle} · thread
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {tweets.map((t, i) => (
          <div
            key={i}
            style={{
              background: i % 2 === 0 ? WHITE : "#e4e4e8",
              borderRadius: 20,
              padding: "24px 28px",
              fontFamily: FONT_BODY,
              fontWeight: 600,
              fontSize: 36,
              lineHeight: 1.3,
              color: BLACK,
              opacity: anim(i).opacity,
              transform: anim(i).transform,
            }}
          >
            {splitLines(t.text, 30).join("\n")}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** ── News / article card ─────────────────────────────────────────────── */
export const NewsCard: React.FC<{
  title: string;
  excerpt?: string;
  author?: string;
  source?: string;
}> = ({ title, excerpt, author, source }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const lines = splitLines(excerpt || title, 30);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 7%" }}>
      <div
        style={{
          width: "100%",
          background: WHITE,
          borderRadius: 28,
          padding: "46px 44px",
          transform: `translateY(${(1 - pop) * 30}px)`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* news kicker */}
        <div
          style={{
            display: "inline-block",
            background: BLACK,
            color: WHITE,
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "8px 18px",
            borderRadius: 8,
            marginBottom: 26,
          }}
        >
          {source || "News"}
        </div>

        {/* headline */}
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: 1.15,
            color: BLACK,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          {splitLines(title, 26).join("\n")}
        </div>

        {/* excerpt */}
        <div
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 500,
            fontSize: 36,
            lineHeight: 1.4,
            color: "#3a3a40",
            borderTop: "2px solid #000",
            paddingTop: 22,
            whiteSpace: "pre-wrap",
          }}
        >
          {lines.join("\n")}
        </div>

        {/* footer */}
        {(author || source) && (
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 26, color: GREY, marginTop: 20 }}>
            {author ? `— ${author}` : ""}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Helper: format numbers compactly (1234 → 1.2K). */
export function formatCount(n: number): string {
  if (n == null) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}