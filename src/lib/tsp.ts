export type City = {
  id: number;
  name: string;
  emoji: string;
  x: number;
  y: number;
};

/** The five friendly stops used across the whole journey. */
export const CITIES: City[] = [
  { id: 0, name: "Home", emoji: "🏠", x: 110, y: 320 },
  { id: 1, name: "Bakery", emoji: "🥐", x: 210, y: 110 },
  { id: 2, name: "Bookshop", emoji: "📚", x: 420, y: 90 },
  { id: 3, name: "Garden", emoji: "🌻", x: 500, y: 300 },
  { id: 4, name: "Pier", emoji: "⛵", x: 290, y: 370 },
];

export const euclid = (a: City, b: City) =>
  Math.round(Math.hypot(a.x - b.x, a.y - b.y) / 10);

export function buildMatrix(cities: City[] = CITIES): number[][] {
  return cities.map((a) => cities.map((b) => (a.id === b.id ? 0 : euclid(a, b))));
}

export const MATRIX = buildMatrix();

export function tourCost(tour: number[], m: number[][] = MATRIX): number {
  let total = 0;
  for (let i = 0; i < tour.length; i++) {
    total += m[tour[i]!]![tour[(i + 1) % tour.length]!]!;
  }
  return total;
}

export function labelTour(tour: number[], cities: City[] = CITIES): string {
  return [...tour, tour[0]!].map((i) => cities[i]!.name).join(" → ");
}

export function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

/* ---------------- Brute force ---------------- */

export type BruteStep = {
  index: number;
  tour: number[];
  cost: number;
  isNewBest: boolean;
  bestCost: number;
  bestTour: number[];
};

export function bruteForceSteps(m: number[][] = MATRIX): BruteStep[] {
  const others = m.map((_, i) => i).slice(1);
  let bestCost = Infinity;
  let bestTour: number[] = [];
  return permutations(others).map((p, index) => {
    const tour = [0, ...p];
    const cost = tourCost(tour, m);
    const isNewBest = cost < bestCost;
    if (isNewBest) {
      bestCost = cost;
      bestTour = tour;
    }
    return { index, tour, cost, isNewBest, bestCost, bestTour: [...bestTour] };
  });
}

/* ---------------- Held–Karp dynamic programming ---------------- */

export type DPEntry = {
  mask: number;
  end: number;
  cost: number;
  from: number | null;
  subsetLabel: string;
};

export type DPResult = {
  entries: DPEntry[];
  cost: number;
  tour: number[];
  statesComputed: number;
  relaxations: number;
};

export function heldKarp(m: number[][] = MATRIX, cities: City[] = CITIES): DPResult {
  const n = m.length;
  const full = 1 << n;
  const dp = Array.from({ length: full }, () => new Array<number>(n).fill(Infinity));
  const parent = Array.from({ length: full }, () => new Array<number>(n).fill(-1));
  const entries: DPEntry[] = [];
  let relaxations = 0;

  const label = (mask: number) =>
    "{" +
    cities
      .filter((_, i) => mask & (1 << i))
      .map((c) => c.name)
      .join(", ") +
    "}";

  dp[1]![0] = 0;

  for (let mask = 1; mask < full; mask++) {
    if (!(mask & 1)) continue;
    for (let end = 0; end < n; end++) {
      if (!(mask & (1 << end)) || dp[mask]![end] === Infinity) continue;
      if (mask !== 1) {
        entries.push({
          mask,
          end,
          cost: dp[mask]![end]!,
          from: parent[mask]![end]! < 0 ? null : parent[mask]![end]!,
          subsetLabel: label(mask),
        });
      }
      for (let next = 1; next < n; next++) {
        if (mask & (1 << next)) continue;
        relaxations++;
        const nextMask = mask | (1 << next);
        const candidate = dp[mask]![end]! + m[end]![next]!;
        if (candidate < dp[nextMask]![next]!) {
          dp[nextMask]![next] = candidate;
          parent[nextMask]![next] = end;
        }
      }
    }
  }

  const allMask = full - 1;
  let best = Infinity;
  let bestEnd = 0;
  for (let end = 1; end < n; end++) {
    const total = dp[allMask]![end]! + m[end]![0]!;
    if (total < best) {
      best = total;
      bestEnd = end;
    }
  }

  const tour: number[] = [];
  let mask = allMask;
  let cur = bestEnd;
  while (cur !== -1) {
    tour.push(cur);
    const prev = parent[mask]![cur]!;
    mask ^= 1 << cur;
    cur = prev;
  }
  tour.reverse();

  return {
    entries,
    cost: best,
    tour,
    statesComputed: entries.length,
    relaxations,
  };
}

/* ---------------- Branch and bound ---------------- */

export type BnBEvent = {
  path: number[];
  cost: number;
  bound: number;
  action: "explore" | "prune" | "complete" | "improve";
  bestCost: number;
  message: string;
};

export type BnBResult = {
  events: BnBEvent[];
  cost: number;
  tour: number[];
  explored: number;
  pruned: number;
};

function minEdgeOut(i: number, remaining: number[], m: number[][]) {
  let best = Infinity;
  for (const j of remaining) if (j !== i) best = Math.min(best, m[i]![j]!);
  return best === Infinity ? 0 : best;
}

export function branchAndBound(m: number[][] = MATRIX, names?: string[]): BnBResult {
  const n = m.length;
  const label = (p: number[]) => p.map((i) => names?.[i] ?? i).join("→");
  const events: BnBEvent[] = [];
  let bestCost = Infinity;
  let bestTour: number[] = [];
  let explored = 0;
  let pruned = 0;

  const search = (path: number[], cost: number) => {
    const visited = new Set(path);
    const remaining = m.map((_, i) => i).filter((i) => !visited.has(i));

    if (remaining.length === 0) {
      const total = cost + m[path[path.length - 1]!]![0]!;
      explored++;
      if (total < bestCost) {
        bestCost = total;
        bestTour = [...path];
        events.push({
          path: [...path],
          cost: total,
          bound: total,
          action: "improve",
          bestCost,
          message: `Complete tour ${label(path)}→${names?.[0] ?? 0} costs ${total}. New best!`,
        });
      } else {
        events.push({
          path: [...path],
          cost: total,
          bound: total,
          action: "complete",
          bestCost,
          message: `Complete tour costs ${total} — not better than ${bestCost}.`,
        });
      }
      return;
    }

    for (const next of remaining) {
      const newCost = cost + m[path[path.length - 1]!]![next]!;
      const rest = remaining.filter((i) => i !== next);
      const optimistic =
        newCost +
        minEdgeOut(next, [...rest, 0], m) +
        rest.reduce((acc, i) => acc + minEdgeOut(i, [...rest.filter((r) => r !== i), 0], m), 0);
      const newPath = [...path, next];

      if (optimistic >= bestCost) {
        pruned++;
        events.push({
          path: newPath,
          cost: newCost,
          bound: optimistic,
          action: "prune",
          bestCost,
          message: `Prune ${label(newPath)} — lower bound ${optimistic} ≥ best ${bestCost}.`,
        });
        continue;
      }

      explored++;
      events.push({
        path: newPath,
        cost: newCost,
        bound: optimistic,
        action: "explore",
        bestCost,
        message: `Explore ${label(newPath)} — cost so far ${newCost}, bound ${optimistic}.`,
      });
      search(newPath, newCost);
    }
  };

  search([0], 0);
  return { events, cost: bestCost, tour: bestTour, explored, pruned };
}

/* ---------------- Heuristics ---------------- */

export function nearestNeighbor(m: number[][] = MATRIX, start = 0) {
  const n = m.length;
  const visited = new Set([start]);
  const tour = [start];
  const steps: { from: number; to: number; cost: number }[] = [];
  while (tour.length < n) {
    const cur = tour[tour.length - 1]!;
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited.has(j)) continue;
      if (m[cur]![j]! < bestD) {
        bestD = m[cur]![j]!;
        best = j;
      }
    }
    visited.add(best);
    tour.push(best);
    steps.push({ from: cur, to: best, cost: bestD });
  }
  return { tour, cost: tourCost(tour, m), steps };
}

export function twoOptOnce(tour: number[], m: number[][] = MATRIX) {
  const n = tour.length;
  let bestGain = 0;
  let bestTour = tour;
  for (let i = 1; i < n - 1; i++) {
    for (let k = i + 1; k < n; k++) {
      const candidate = [...tour.slice(0, i), ...tour.slice(i, k + 1).reverse(), ...tour.slice(k + 1)];
      const gain = tourCost(tour, m) - tourCost(candidate, m);
      if (gain > bestGain) {
        bestGain = gain;
        bestTour = candidate;
      }
    }
  }
  return { tour: bestTour, improved: bestGain > 0, gain: bestGain };
}

export const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

export function formatBig(n: number): string {
  if (n < 1e6) return n.toLocaleString("en-US");
  return n.toExponential(2).replace("e+", " × 10^");
}
