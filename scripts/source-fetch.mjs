#!/usr/bin/env node
/**
 * Fetch source content for shorts rendering.
 *
 * Supports:
 *  - Twitter/X: thread via fxtwitter API (status pages → JSON)
 *      url          https://x.com/user/status/1234 (or twitter.com)
 *      returns      { tweets: [{ id, handle, name, text, media?, likes, retweets, replies, views }] }
 *  - News/article: via Jina Reader (r.jina.ai) — text extraction
 *      url          any http(s) article
 *      returns      { title, url, author, published, text }
 *
 * Usage: node source-fetch.mjs <url> [--thread] [--maxTweets N]
 * Output: JSON to stdout: { type: "tweet"|"news"|"error", ... }
 */
const MAX_TWEETS = Number(process.argv.find((a, i) => process.argv[i - 1] === "--maxTweets") || 6);

function err(msg, extra = {}) {
  console.log(JSON.stringify({ type: "error", error: msg, ...extra }));
  process.exit(1);
}

function isTweetUrl(u) {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(u);
}

function parseTweetId(u) {
  const m = u.match(/status\/(\d+)/i);
  return m ? m[1] : null;
}

function parseHandle(u) {
  const m = u.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i);
  return m ? m[1] : null;
}

async function fetchTwitter(u) {
  const id = parseTweetId(u);
  const handle = parseHandle(u);
  if (!id || !handle) err("invalid tweet url");

  // Try fxtwitter API for the tweet + thread context
  const api = `https://api.fxtwitter.com/${handle}/status/${id}`;
  const res = await fetch(api, { headers: { "User-Agent": "hamc-shorts/1.0" } });
  if (!res.ok) err(`fxtwitter ${res.status}`);
  const data = await res.json();
  const t = data?.tweet;
  if (!t) err("no tweet data", { raw: JSON.stringify(data).slice(0, 200) });

  // Collect thread: current tweet + replies chain (tweet.replies / quoted)
  const tweets = [];
  const pushTweet = (tw, isRoot = false) => {
    if (!tw) return;
    const text = (tw.text || tw.rawText || "").trim();
    if (!text) return;
    tweets.push({
      id: tw.id || tw.id_str || null,
      handle: tw.author?.screen_name || handle,
      name: tw.author?.name || tw.author?.user_name || handle,
      text: text.slice(0, 500), // safety
      media: tw.media?.all?.length ? tw.media.all.map((m) => ({ type: m.type, url: m.url, thumb: m.thumbnail_url })) : [],
      likes: tw.likes ?? null,
      retweets: tw.retweets ?? null,
      replies: tw.replies ?? null,
      views: tw.views ?? null,
      isRoot,
    });
  };

  pushTweet(t, true);

  // Try to pull thread replies if fxtwitter exposed them (data.tweet.replies can be a list)
  const replies = Array.isArray(t.replies) ? t.replies : Array.isArray(data?.tweet?.thread) ? data.tweet.thread : [];
  for (const r of replies.slice(0, MAX_TWEETS - 1)) pushTweet(r);

  if (tweets.length === 1) {
    // No thread from API; attempt simple scrape via Jina on the status URL (best effort)
    try {
      const j = await fetch(`https://r.jina.ai/${u}`, {
        headers: { "User-Agent": "Mozilla/5.0", "X-Return-Format": "text" },
        signal: AbortSignal.timeout(20000),
      });
      if (j.ok) {
        const text = (await j.text()).slice(0, 4000);
        // split into thread-ish sentences by newlines
        const lines = text.split("\n").map((s) => s.trim()).filter((s) => s.length > 20 && !s.startsWith("http") && !/^\d+\s*(like|retweet|reply|view)s?$/i.test(s));
        if (lines.length > 1) {
          tweets.push(...lines.slice(0, MAX_TWEETS - 1).map((txt, i) => ({
            id: null, handle, name: tweets[0].name, text: txt.slice(0, 500), isRoot: false,
          })));
        }
      }
    } catch { /* keep single tweet */ }
  }

  return { type: "tweet", id, handle, tweets };
}

async function fetchNews(u) {
  const res = await fetch(`https://r.jina.ai/${u}`, {
    headers: { "User-Agent": "Mozilla/5.0 (shorts-renderer/1.0)", "X-Return-Format": "markdown" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) err(`jina ${res.status}`);
  const text = (await res.text()).trim();

  // Jina frontmatter: Title, URL, date, author, then body
  let title = "";
  let author = "";
  let published = "";
  let body = text;
  const fm = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fm) {
    body = fm[2].trim();
    const titleM = fm[1].match(/^Title:\s*(.+)$/m);
    const authorM = fm[1].match(/^Author:\s*(.+)$/m);
    const dateM = fm[1].match(/^(?:date|Date|Published):\s*(.+)$/m);
    if (titleM) title = titleM[1].trim();
    if (authorM) author = authorM[1].trim();
    if (dateM) published = dateM[1].trim();
  }
  if (!title) {
    const h = body.match(/^#\s+(.+)$/m);
    if (h) title = h[1].trim();
  }
  if (!title) title = u;

  // Keep the first N paragraphs as the "news excerpt" (headlines + key facts)
  const paras = body
    .split(/\n\s*\n/)
    .map((s) => s.replace(/^#{1,3}\s+/, "").trim())
    .filter((s) => s.length > 40 && s.length < 500 && !/^https?:\/\//i.test(s));

  return {
    type: "news",
    url: u,
    title: title.slice(0, 200),
    author: author.slice(0, 100),
    published: published.slice(0, 60),
    excerpt: paras.slice(0, 4).join("\n\n"),
    paragraphs: paras.slice(0, 8),
  };
}

async function main() {
  const url = process.argv[2];
  if (!url) err("usage: source-fetch.mjs <url>");
  const out = isTweetUrl(url) ? await fetchTwitter(url) : await fetchNews(url);
  console.log(JSON.stringify(out));
}

main().catch((e) => err(e.message));