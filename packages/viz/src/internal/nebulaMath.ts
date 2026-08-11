/**
 * Headless math for the Nebula 3D concept map. Deterministic by construction
 * (fixed sinusoidal seeds, no Math.random): link weights become dissimilarities,
 * the matrix is completed via Floyd–Warshall shortest paths (Isomap-style, so
 * "related to a related thing" still pulls items together), then classical MDS
 * (Torgerson) embeds everything in 3D via double-centering + deflated power
 * iteration. Rotation/projection helpers are what the component applies per
 * render. Pure functions, no DOM.
 */

export type Point3 = readonly [number, number, number];

export interface NebulaMathLink {
  /** Item index (already resolved, deduped, and bounds-checked by the caller). */
  a: number;
  b: number;
  /** Relatedness 0..1 — mapped to distance `1 − w`. */
  w: number;
}

/** Linked pairs never sit closer than this (labels need breathing room). */
const MIN_LINK_DIST = 0.08;
/** Unreachable pairs land just beyond the widest connected span. */
const UNREACHED_FACTOR = 1.35;
/** Same-group pairs contract toward each other after path completion. */
const SAME_GROUP_PULL = 0.72;
const POWER_ITERATIONS = 80;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Pairwise dissimilarity matrix: direct links map to `1 − weight` (floored so
 * strongly-linked pairs don't overlap), indirect proximity comes from shortest
 * paths, disconnected pairs sit at a far-but-finite rim, and same-group pairs
 * contract by a constant pull. Symmetric, finite, zero diagonal — always.
 * O(n³) in the item count; callers memoize.
 */
export function completeDistances(
  count: number,
  links: readonly NebulaMathLink[],
  groupOf?: readonly number[],
): number[][] {
  const INF = Number.POSITIVE_INFINITY;
  const d: number[][] = Array.from({ length: count }, (_, i) =>
    Array.from({ length: count }, (_, j) => (i === j ? 0 : INF)),
  );

  for (const l of links) {
    if (!Number.isInteger(l.a) || !Number.isInteger(l.b)) continue;
    if (l.a < 0 || l.b < 0 || l.a >= count || l.b >= count || l.a === l.b) continue;
    const w = Number.isFinite(l.w) ? clamp01(l.w) : 0.5;
    const dist = Math.max(MIN_LINK_DIST, 1 - w);
    if (dist < d[l.a][l.b]) {
      d[l.a][l.b] = dist;
      d[l.b][l.a] = dist;
    }
  }

  for (let k = 0; k < count; k++) {
    for (let i = 0; i < count; i++) {
      const dik = d[i][k];
      if (dik === INF) continue;
      const row = d[i];
      const rowK = d[k];
      for (let j = 0; j < count; j++) {
        const via = dik + rowK[j];
        if (via < row[j]) row[j] = via;
      }
    }
  }

  let maxFinite = 0;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (d[i][j] !== INF && d[i][j] > maxFinite) maxFinite = d[i][j];
    }
  }
  const far = (maxFinite || 1) * UNREACHED_FACTOR;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if (d[i][j] === INF) d[i][j] = far;
    }
  }

  if (groupOf) {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (groupOf[i] >= 0 && groupOf[i] === groupOf[j]) {
          d[i][j] *= SAME_GROUP_PULL;
          d[j][i] = d[i][j];
        }
      }
    }
  }

  return d;
}

/** Deterministic seed vector — a fixed sinusoidal hash, never Math.random. */
function seedVector(n: number, axis: number): number[] {
  return Array.from({ length: n }, (_, i) => Math.sin((i + 1) * 12.9898 + (axis + 1) * 78.233));
}

function orthogonalize(v: number[], basis: readonly number[][]): void {
  for (const b of basis) {
    let dot = 0;
    for (let i = 0; i < v.length; i++) dot += v[i] * b[i];
    for (let i = 0; i < v.length; i++) v[i] -= dot * b[i];
  }
}

function norm(v: readonly number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

/**
 * Classical (Torgerson) MDS to 3D: double-center the squared-distance matrix,
 * extract the top three eigenpairs by deflated power iteration, scale each
 * eigenvector by √λ, then normalize so the farthest point sits on the unit
 * sphere. Degenerate inputs collapse axes to 0 rather than throwing.
 */
export function classicalMds3(dist: readonly (readonly number[])[]): Point3[] {
  const n = dist.length;
  if (n === 0) return [];
  if (n === 1) return [[0, 0, 0]];

  // Squared distances, laundered finite (never let NaN into the eigensolver).
  const d2: number[][] = dist.map((row) =>
    Array.from({ length: n }, (_, j) => {
      const v = Number.isFinite(row[j]) ? row[j] : 0;
      return v * v;
    }),
  );

  const rowMean = d2.map((row) => row.reduce((a, b) => a + b, 0) / n);
  const grand = rowMean.reduce((a, b) => a + b, 0) / n;
  // Symmetric input → column means equal row means.
  const B: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => -0.5 * (d2[i][j] - rowMean[i] - rowMean[j] + grand)),
  );

  const coords: number[][] = Array.from({ length: n }, () => [0, 0, 0]);
  const basis: number[][] = [];

  for (let axis = 0; axis < 3 && axis < n; axis++) {
    let v = seedVector(n, axis);
    orthogonalize(v, basis);
    let vn = norm(v);
    if (vn < 1e-9) {
      v = Array.from({ length: n }, (_, i) => (i === axis ? 1 : 0));
      orthogonalize(v, basis);
      vn = norm(v);
      if (vn < 1e-9) break;
    }
    for (let i = 0; i < n; i++) v[i] /= vn;

    let collapsed = false;
    for (let it = 0; it < POWER_ITERATIONS; it++) {
      const w = Array.from({ length: n }, (_, i) => {
        let s = 0;
        const Bi = B[i];
        for (let j = 0; j < n; j++) s += Bi[j] * v[j];
        return s;
      });
      orthogonalize(w, basis);
      const wn = norm(w);
      if (wn < 1e-9) {
        // No variance left along any remaining direction — axis stays 0.
        collapsed = true;
        break;
      }
      for (let i = 0; i < n; i++) v[i] = w[i] / wn;
    }
    if (collapsed) continue;

    let lambda = 0;
    for (let i = 0; i < n; i++) {
      let s = 0;
      const Bi = B[i];
      for (let j = 0; j < n; j++) s += Bi[j] * v[j];
      lambda += v[i] * s;
    }
    const scale = Math.sqrt(Math.max(lambda, 0));
    basis.push(v);
    for (let i = 0; i < n; i++) coords[i][axis] = v[i] * scale;
  }

  let maxR = 0;
  for (const c of coords) {
    const r = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
    if (r > maxR) maxR = r;
  }
  if (maxR > 1e-9) {
    for (const c of coords) {
      c[0] /= maxR;
      c[1] /= maxR;
      c[2] /= maxR;
    }
  }
  return coords.map((c) => [c[0], c[1], c[2]] as const);
}

/** The full auto-layout pipeline: links → completed distances → 3D embedding. */
export function layoutNebula(
  count: number,
  links: readonly NebulaMathLink[],
  groupOf?: readonly number[],
): Point3[] {
  return classicalMds3(completeDistances(count, links, groupOf));
}

/** Yaw about the y-axis, then pitch about the x-axis. */
export function rotateYawPitch(p: Point3, yaw: number, pitch: number): Point3 {
  const [x, y, z] = p;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  return [x1, y2, z2];
}

/** Camera distance in unit-sphere radii — near rim ≈ 1.45×, far rim ≈ 0.76×. */
export const NEBULA_CAMERA = 3.2;

/** Perspective scale for a rotated z in [-1, 1]; guarded so z→camera can't blow up. */
export function perspectiveScale(z: number, camera: number = NEBULA_CAMERA): number {
  return camera / Math.max(camera - z, 0.5);
}
