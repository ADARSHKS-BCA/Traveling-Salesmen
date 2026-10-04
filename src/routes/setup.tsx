import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CityMap } from "@/components/CityMap";
import { NextStep } from "@/components/site/JourneyNav";
import { CITIES, MATRIX } from "@/lib/tsp";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Preconditions & Data Structures — TSP Journey" },
      {
        name: "description",
        content:
          "Before any algorithm runs: the assumptions TSP makes, the graph model, the distance matrix, and the bitmask state used to track visited cities.",
      },
      { property: "og:title", content: "Preconditions & Data Structures — TSP Journey" },
      {
        property: "og:description",
        content: "Graphs, distance matrices and bitmasks — the toolkit every TSP algorithm builds on.",
      },
    ],
  }),
  component: SetupPage,
});

const PRECONDITIONS = [
  {
    e: "🔗",
    t: "The map is complete",
    b: "Every stop can reach every other stop directly. If a road is missing we model it as a very large cost.",
  },
  {
    e: "↔️",
    t: "Costs are symmetric",
    b: "Going Home → Pier costs the same as Pier → Home. (Asymmetric TSP drops this — one-way streets, wind, tolls.)",
  },
  {
    e: "➕",
    t: "Costs are non-negative",
    b: "No road pays you to drive it. Distances, minutes or rupees all work as a cost.",
  },
  {
    e: "📐",
    t: "Triangle inequality (often)",
    b: "A detour is never shorter than going direct. Handy for heuristics, not required for exact methods.",
  },
  {
    e: "🏠",
    t: "The start doesn't matter",
    b: "A tour is a loop, so we can always fix Home as city 0. That immediately divides the search space by n.",
  },
  {
    e: "🔁",
    t: "Direction doesn't matter",
    b: "In symmetric TSP a tour and its reverse cost the same, so distinct tours = (n−1)!/2.",
  },
];

function SetupPage() {
  const [hover, setHover] = useState<{ i: number; j: number } | null>(null);
  const [visited, setVisited] = useState<number[]>([0]);

  const mask = visited.reduce((acc, i) => acc | (1 << i), 0);
  const bits = CITIES.map((_, i) => ((mask >> i) & 1) as 0 | 1);

  const toggle = (id: number) => {
    if (id === 0) return;
    setVisited((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-14">
      <header className="max-w-3xl animate-pop-in">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Step two · the setup
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Before we can solve it, we have to <span className="ink-underline">write it down</span>.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          A computer can’t look at a town. It needs numbers, a structure, and a short list of
          promises about the world. Here they are.
        </p>
      </header>

      {/* Preconditions */}
      <section className="mt-16">
        <h2 className="font-display text-3xl">🧾 The promises we make (preconditions)</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PRECONDITIONS.map((p, i) => (
            <div
              key={p.t}
              className="paper-card p-6 transition-transform hover:-translate-y-1"
              style={{ rotate: `${(i % 3) - 1}deg` }}
            >
              <span className="text-2xl" aria-hidden>
                {p.e}
              </span>
              <h3 className="mt-2 font-display text-lg">{p.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Graph model */}
      <section className="mt-24 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <h2 className="font-display text-3xl">🕸️ Structure #1 — the graph</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Stops become <strong>vertices</strong>, roads become weighted <strong>edges</strong>. A
            valid tour is a <strong>Hamiltonian cycle</strong>: a loop touching every vertex exactly
            once. TSP asks for the cheapest one.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-card p-5 font-mono text-sm">
{`G = (V, E)
V = { Home, Bakery, Bookshop, Garden, Pier }   |V| = n = 5
E = every pair of stops                         |E| = n(n−1)/2 = 10
w(u, v) = cost of travelling between u and v`}
          </pre>
          <p className="mt-4 text-sm text-muted-foreground">
            With 5 stops there are only 10 edges — but 24 possible tours. The edges are cheap; the
            orderings are what explode.
          </p>
        </div>
        <div className="paper-card p-4">
          <CityMap showAllEdges tour={[]} />
          <p className="px-3 pb-2 text-center text-sm text-muted-foreground">
            All 10 edges of the complete graph K₅
          </p>
        </div>
      </section>

      {/* Distance matrix */}
      <section className="mt-24">
        <h2 className="font-display text-3xl">🔢 Structure #2 — the distance matrix</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          An n × n table where <code className="font-mono">d[i][j]</code> is the cost from stop i to
          stop j. Lookups are O(1), memory is O(n²). Hover a cell to see the pair it describes.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[560px] border-collapse text-center font-mono text-sm">
            <thead>
              <tr>
                <th className="p-2" />
                {CITIES.map((c) => (
                  <th key={c.id} className="p-2 text-xs font-bold">
                    {c.emoji} {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row, i) => (
                <tr key={i}>
                  <th className="p-2 text-left text-xs font-bold">
                    {CITIES[i]!.emoji} {CITIES[i]!.name}
                  </th>
                  {row.map((v, j) => {
                    const active = hover && (hover.i === i || hover.j === j);
                    return (
                      <td
                        key={j}
                        onMouseEnter={() => setHover({ i, j })}
                        onMouseLeave={() => setHover(null)}
                        className={`border border-border p-3 transition-colors ${
                          i === j
                            ? "bg-muted text-muted-foreground"
                            : active
                              ? "bg-honey text-honey-foreground"
                              : "bg-card"
                        }`}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {hover && hover.i !== hover.j ? (
            <>
              <strong>
                {CITIES[hover.i]!.name} ↔ {CITIES[hover.j]!.name}
              </strong>{" "}
              costs {MATRIX[hover.i]![hover.j]} km — and the mirrored cell holds the same value,
              because our map is symmetric.
            </>
          ) : (
            "The diagonal is always 0, and the table is mirrored across it."
          )}
        </p>
      </section>

      {/* Bitmask */}
      <section className="mt-24 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <h2 className="font-display text-3xl">🎛️ Structure #3 — the visited bitmask</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Algorithms need to remember “which stops have I already covered?”. A set is slow to hash;
            an integer is not. Each stop owns one bit, so a whole subset fits in a single number —
            this is exactly what makes Held–Karp’s{" "}
            <code className="font-mono">dp[S][i]</code> table possible.
          </p>
          <p className="mt-3 text-lg text-muted-foreground">
            Tap the stops on the map to switch their bits on and off.
          </p>
          <div className="mt-6 paper-card p-6">
            <div className="flex flex-wrap items-center gap-2">
              {[...bits].reverse().map((b, idx) => {
                const cityIndex = bits.length - 1 - idx;
                return (
                  <div key={cityIndex} className="text-center">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 font-mono text-lg font-bold ${
                        b ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                      }`}
                    >
                      {b}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {CITIES[cityIndex]!.emoji}
                    </div>
                  </div>
                );
              })}
              <div className="ml-3">
                <p className="font-mono text-sm text-muted-foreground">binary</p>
                <p className="font-mono text-lg font-bold text-primary">
                  0b{[...bits].reverse().join("")} = {mask}
                </p>
              </div>
            </div>
            <p className="mt-4 font-mono text-sm">
              S = {"{"}
              {visited
                .slice()
                .sort((a, b) => a - b)
                .map((i) => CITIES[i]!.name)
                .join(", ")}
              {"}"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              There are 2⁵ = 32 possible subsets. Pair each with a “current stop” and you get the
              n·2ⁿ states the DP algorithm fills in.
            </p>
          </div>
        </div>
        <div className="paper-card p-4">
          <CityMap tour={[]} selected={visited} onCityClick={toggle} />
          <p className="px-3 pb-2 text-center text-sm text-muted-foreground">
            Tap a stop to toggle its bit (Home is always visited)
          </p>
        </div>
      </section>

      {/* Cheat sheet */}
      <section className="mt-24 wobble-border border-2 border-primary/40 bg-accent/40 p-8">
        <h2 className="font-display text-2xl">🧠 Pocket cheat sheet</h2>
        <ul className="mt-4 grid gap-3 text-base sm:grid-cols-2">
          <li>
            <strong>Input:</strong> n stops + an n × n cost matrix.
          </li>
          <li>
            <strong>Output:</strong> a permutation of the stops (a loop) with minimum total cost.
          </li>
          <li>
            <strong>Search space:</strong> (n−1)! directed tours, (n−1)!/2 distinct ones.
          </li>
          <li>
            <strong>Decision version:</strong> “is there a tour under cost k?” — NP-complete.
          </li>
        </ul>
      </section>

      <NextStep
        to="/simulation"
        label="Next: try it yourself"
        hint="Structures in place. Time to get your hands on the map."
      />
    </div>
  );
}
