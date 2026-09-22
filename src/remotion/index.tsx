import { registerRoot, Composition } from "remotion";
import { ShortsVideo, useTotalDuration } from "./ShortsVideo";

const DEFAULT_SEGMENTS = [
  { text: "Demo shorts — configure --props to customize.", duration: 60 },
];

const Shorts: React.FC = () => {
  return (
    <Composition
      id="Shorts"
      component={ShortsVideo as any}
      durationInFrames={60}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ segments: DEFAULT_SEGMENTS }}
      calculateMetadata={({ props }) => {
        const segs = props.segments?.length ? props.segments : DEFAULT_SEGMENTS;
        return { durationInFrames: useTotalDuration(segs) };
      }}
    />
  );
};

registerRoot(Shorts);