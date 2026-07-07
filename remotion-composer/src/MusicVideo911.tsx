import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FPS = 24;

// ─── Ken Burns Still Frame ────────────────────────────────────────────────────
const KenBurnsFrame: React.FC<{
  src: string;
  filter?: string;
  zoomDirection?: "in" | "out";
  panX?: number; // 0 = no pan, positive = pan right, negative = pan left
  fadeInFrames?: number;
  fadeOutFrames?: number;
}> = ({
  src,
  filter = "contrast(1.08) saturate(0.82) brightness(0.88)",
  zoomDirection = "in",
  panX = 0,
  fadeInFrames = 24,
  fadeOutFrames = 18,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, Math.max(1, fadeInFrames)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(fadeInFrames, durationInFrames - fadeOutFrames), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const progress = frame / Math.max(1, durationInFrames);
  const startScale = zoomDirection === "in" ? 1.0 : 1.08;
  const endScale = zoomDirection === "in" ? 1.08 : 1.0;
  const scale = startScale + (endScale - startScale) * progress;
  const translateX = panX * progress;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity }}>
      {/* Vignette under image */}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)", zIndex: 2 }}
      />
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}px)`,
          filter,
          zIndex: 1,
        }}
      />
      {/* Film grain overlay */}
      <AbsoluteFill
        style={{
          zIndex: 3,
          background:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 2px, transparent 5px)",
          opacity: 0.3,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Title Card ───────────────────────────────────────────────────────────────
const TitleCard: React.FC<{
  text: string;
  accent?: string;
  fontSize?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}> = ({
  text,
  accent = "#C8A97E",
  fontSize = 120,
  fadeInFrames = 18,
  fadeOutFrames = 14,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const reveal = spring({ fps, frame, config: { damping: 20, stiffness: 100 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - fadeOutFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = reveal * fadeOut;
  const y = interpolate(reveal, [0, 1], [24, 0]);
  const letterSpacing = interpolate(reveal, [0, 1], [0.5, 0.22]);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 44%, rgba(14,22,32,0.92) 0%, rgba(2,4,8,1) 60%, #000 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Accent lines */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 1.5,
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
          opacity: 0.35 * reveal,
          transform: "translateY(-90px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 1.5,
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
          opacity: 0.25 * reveal,
          transform: "translateY(90px)",
        }}
      />
      {/* Text */}
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize,
          letterSpacing: `${letterSpacing}em`,
          color: "#f0ece4",
          textTransform: "uppercase",
          textShadow: `0 0 40px ${accent}44`,
        }}
      >
        {text}
      </div>
      {/* Film grain */}
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 6px)",
          opacity: 0.2,
        }}
      />
    </AbsoluteFill>
  );
};

// ─── Scene definitions ────────────────────────────────────────────────────────
interface Scene {
  id: string;
  startSeconds: number;
  durationSeconds: number;
  kind: "still" | "title";
  // still params
  src?: string;
  filter?: string;
  zoomDirection?: "in" | "out";
  panX?: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  // title params
  text?: string;
  accent?: string;
  fontSize?: number;
}

const SCENES: Scene[] = [
  // "9 . 11" title opener — 4s
  {
    id: "title-911",
    kind: "title",
    startSeconds: 0,
    durationSeconds: 4,
    text: "9 . 11",
    accent: "#C8A97E",
    fontSize: 110,
  },
  // Frame 1: Porsche 911 night highway — 20s
  {
    id: "s01",
    kind: "still",
    startSeconds: 4,
    durationSeconds: 20,
    src: "911/frame_01.jpg",
    filter: "contrast(1.08) saturate(0.78) brightness(0.85)",
    zoomDirection: "in",
    panX: -12,
    fadeInFrames: 28,
    fadeOutFrames: 20,
  },
  // Frame 2: Cockpit/steering wheel — 18s
  {
    id: "s02",
    kind: "still",
    startSeconds: 24,
    durationSeconds: 18,
    src: "911/frame_02.jpg",
    filter: "contrast(1.12) saturate(0.72) brightness(0.9)",
    zoomDirection: "out",
    panX: 8,
    fadeInFrames: 22,
    fadeOutFrames: 18,
  },
  // "11 . 9" title — 4s
  {
    id: "title-119",
    kind: "title",
    startSeconds: 42,
    durationSeconds: 4,
    text: "11 . 9",
    accent: "#C8A97E",
    fontSize: 110,
  },
  // Frame 3: Two Porsches side by side — 22s
  {
    id: "s03",
    kind: "still",
    startSeconds: 46,
    durationSeconds: 22,
    src: "911/frame_03.jpg",
    filter: "contrast(1.06) saturate(0.82) brightness(0.86)",
    zoomDirection: "in",
    panX: 6,
    fadeInFrames: 24,
    fadeOutFrames: 20,
  },
  // Frame 4: Tucson night skyline — 20s
  {
    id: "s04",
    kind: "still",
    startSeconds: 68,
    durationSeconds: 20,
    src: "911/frame_04.jpg",
    filter: "contrast(1.04) saturate(0.88) brightness(0.88)",
    zoomDirection: "out",
    panX: -6,
    fadeInFrames: 20,
    fadeOutFrames: 18,
  },
  // Frame 00: Original song art (emergency lights) — 18s
  {
    id: "s00",
    kind: "still",
    startSeconds: 88,
    durationSeconds: 18,
    src: "911/frame_00_song_art.jpg",
    filter: "contrast(1.15) saturate(0.70) brightness(0.80)",
    zoomDirection: "in",
    panX: 0,
    fadeInFrames: 20,
    fadeOutFrames: 18,
  },
  // Frame 5: Instrument cluster — 18s
  {
    id: "s05",
    kind: "still",
    startSeconds: 106,
    durationSeconds: 18,
    src: "911/frame_05.jpg",
    filter: "contrast(1.1) saturate(0.76) brightness(0.88)",
    zoomDirection: "out",
    panX: 10,
    fadeInFrames: 18,
    fadeOutFrames: 18,
  },
  // Frame 6: Desert highway tail lights disappearing — 20s
  {
    id: "s06",
    kind: "still",
    startSeconds: 124,
    durationSeconds: 20,
    src: "911/frame_06.jpg",
    filter: "contrast(1.06) saturate(0.85) brightness(0.88)",
    zoomDirection: "in",
    panX: -4,
    fadeInFrames: 20,
    fadeOutFrames: 18,
  },
  // Frame 7: Two tire tracks at dawn — 20s
  {
    id: "s07",
    kind: "still",
    startSeconds: 144,
    durationSeconds: 20,
    src: "911/frame_07.jpg",
    filter: "contrast(1.04) saturate(0.90) brightness(0.92)",
    zoomDirection: "out",
    panX: 0,
    fadeInFrames: 20,
    fadeOutFrames: 18,
  },
  // Frame 8: Porsche rear tail lights — 18s
  {
    id: "s08",
    kind: "still",
    startSeconds: 164,
    durationSeconds: 18,
    src: "911/frame_08.jpg",
    filter: "contrast(1.1) saturate(0.74) brightness(0.84)",
    zoomDirection: "in",
    panX: 8,
    fadeInFrames: 18,
    fadeOutFrames: 18,
  },
  // Frame 9: The number 911 — 12s
  {
    id: "s09",
    kind: "still",
    startSeconds: 182,
    durationSeconds: 12,
    src: "911/frame_09.jpg",
    filter: "contrast(1.08) saturate(0.76) brightness(0.86)",
    zoomDirection: "in",
    panX: 0,
    fadeInFrames: 14,
    fadeOutFrames: 16,
  },
  // Frame 10: The date 9/11 — 6s bridge
  {
    id: "s10",
    kind: "still",
    startSeconds: 188,
    durationSeconds: 6,
    src: "911/frame_10.jpg",
    filter: "contrast(1.06) saturate(0.82) brightness(0.88)",
    zoomDirection: "out",
    panX: 0,
    fadeInFrames: 12,
    fadeOutFrames: 10,
  },
  // "RORY WILL" end title — last 6.8s
  {
    id: "title-end",
    kind: "title",
    startSeconds: 194,
    durationSeconds: 6.8,
    text: "RORY WILL",
    accent: "#C8A97E",
    fontSize: 128,
  },
];

// Total duration driven by last scene end
const TOTAL_SECONDS = Math.max(
  ...SCENES.map((s) => s.startSeconds + s.durationSeconds)
);

export const MusicVideo911: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SCENES.map((scene) => (
        <Sequence
          key={scene.id}
          from={Math.round(scene.startSeconds * FPS)}
          durationInFrames={Math.round(scene.durationSeconds * FPS)}
        >
          {scene.kind === "still" ? (
            <KenBurnsFrame
              src={scene.src!}
              filter={scene.filter}
              zoomDirection={scene.zoomDirection}
              panX={scene.panX}
              fadeInFrames={scene.fadeInFrames}
              fadeOutFrames={scene.fadeOutFrames}
            />
          ) : (
            <TitleCard
              text={scene.text!}
              accent={scene.accent}
              fontSize={scene.fontSize}
              fadeInFrames={18}
              fadeOutFrames={14}
            />
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Export total duration for Root.tsx registration
export const MUSIC_VIDEO_TOTAL_FRAMES = Math.ceil(TOTAL_SECONDS * FPS);
