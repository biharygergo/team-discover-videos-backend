const FRAME_RATE = 30;

export function overlapsIntervalFrames(
  intervalStart: number,
  intervalEnd: number,
  timestampSeconds: number
) {
  const frameTimestamp = timestampSeconds * FRAME_RATE;
  return intervalStart <= frameTimestamp && intervalEnd >= frameTimestamp;
}
