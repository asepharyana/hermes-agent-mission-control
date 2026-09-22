#!/usr/bin/env python3
"""TTS with per-sentence timing (karaoke captions).

Usage: tts-words.py <text> <voice> <out.mp3> <out.sentences.json>
Writes mp3 + JSON [{w, start, end}] (seconds, relative to segment start).
Uses edge-tts SentenceBoundary stream events.
"""
import asyncio
import json
import sys

import edge_tts


async def main(text: str, voice: str, mp3_path: str, sentences_path: str) -> None:
    comm = edge_tts.Communicate(text, voice)
    sentences = []
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk.get("type") == "audio":
                f.write(chunk.get("data", b""))
            elif chunk.get("type") == "SentenceBoundary":
                start = chunk.get("offset", 0) / 1e7
                dur = chunk.get("duration", 0) / 1e7
                sentences.append(
                    {"w": chunk.get("text", ""), "start": round(start, 3), "end": round(start + dur, 3)}
                )
    with open(sentences_path, "w") as f:
        json.dump(sentences, f)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]))