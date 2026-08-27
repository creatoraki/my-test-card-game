export type CrackPoint = readonly [number, number];

const EPSILON = 0.000001;

function normalize(x: number, y: number): [number, number] {
  const length = Math.hypot(x, y);
  if (length < EPSILON) return [0, 0];
  return [x / length, y / length];
}

function directionBetween(from: CrackPoint, to: CrackPoint): [number, number] {
  return normalize(to[0] - from[0], to[1] - from[1]);
}

function directionAt(points: readonly CrackPoint[], index: number): [number, number] {
  if (index === 0) return directionBetween(points[0], points[1]);
  if (index === points.length - 1) return directionBetween(points[index - 1], points[index]);

  const previous = directionBetween(points[index - 1], points[index]);
  const next = directionBetween(points[index], points[index + 1]);
  const bisector = normalize(previous[0] + next[0], previous[1] + next[1]);
  if (Math.hypot(bisector[0], bisector[1]) >= EPSILON) return bisector;
  return Math.hypot(next[0], next[1]) >= EPSILON ? next : previous;
}

function formatCoordinate(value: number): string {
  if (Math.abs(value) < 0.0005) return "0";
  return String(Number(value.toFixed(3)));
}

export function buildCrackPath(points: readonly CrackPoint[], rootWidth: number): string {
  if (points.length < 2) return "";

  const safeRootWidth = Math.max(0, rootWidth);
  const leftSide: CrackPoint[] = [];
  const rightSide: CrackPoint[] = [];
  const lastIndex = points.length - 1;

  points.forEach((point, index) => {
    const direction = directionAt(points, index);
    const normal: CrackPoint = [-direction[1], direction[0]];
    const width = safeRootWidth * (1 - index / lastIndex) ** 1.4;
    const halfWidth = width / 2;
    leftSide.push([point[0] + normal[0] * halfWidth, point[1] + normal[1] * halfWidth]);
    rightSide.push([point[0] - normal[0] * halfWidth, point[1] - normal[1] * halfWidth]);
  });

  const outline = [...leftSide, ...rightSide.reverse()];
  const [first, ...rest] = outline;
  return `M ${formatCoordinate(first[0])} ${formatCoordinate(first[1])} ${rest
    .map((point) => `L ${formatCoordinate(point[0])} ${formatCoordinate(point[1])}`)
    .join(" ")} Z`;
}
