import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CityMap } from "@/components/CityMap";
import {
  CITIES,
  MATRIX,
  bruteForceSteps,
  branchAndBound,
  heldKarp,
  labelTour,
  nearestNeighbor,
  tourCost,
  twoOptOnce,
} from "@/lib/tsp";

export const Route = createFileRoute("/algorithms")({
  head: () => ({
    meta: [
      { title: "The Real Algorithms — TSP Time & Space Complexity" },
      {
        name: "description",
        content:
          "Brute force, Held–Karp dynamic programming, branch and bound and heuristics — live simulations, pseudocode and full time and space complexity analysis.",
      },
      { property: "og:title", content: "The Real Algorithms — TSP Time & Space Complexity" },
      {
        property: "og:description",
        content: "Run Held–Karp and branch & bound step by step, with complexity analysis for each.",
      },
    ],
  }),
  component: AlgorithmsPage,
});

function AlgorithmsPage() {
  const brute = useMemo(() => bruteForceSteps(), []);
  const dp = useMemo(() => heldKarp(), []);
  const bnb = useMemo(
    () => branchAndBound(MATRIX, CITIES.map((c) => c.name)),
    [],
  );
  const nn = useMemo(() => nearestNeighbor(), []);

  const [dpShown, setDpShown] = useState(0);
  const [bnbShown, setBnbShown] = useState(0);
  const [heurTour, setHeurTour] = useState<number[]>(nn.tour);
  const [heurNote, setHeurNote] = useState("Nearest neighbour result — greedy, fast, not optimal.");

  const bnbEvent = bnbShown > 0 ? bnb.events[bnbShown - 1]! : null;
  const bnbExplored = bnb.events.slice(0, bnbShown).filter((e) => e.action !== "prune").length;
  const bnbPruned = bnb.events.slice(0, bnbShown).filter((e) => e.action === "prune").length;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-14">
      <header className="max-w-3xl animate-pop-in">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Step four · the machinery
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Four honest attempts at an <span className="ink-underline">impossible</span> problem.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Same five stops, same optimal answer of {dp.cost} km. What changes is how much work each
          strategy does to get there — and that difference is the entire field.
        </p>
      </header>

      {/* 1. Brute force */}
      <AlgoCard
        badge="01"
        title="Brute Force — try everything"
        idea="Generate every permutation of the stops, cost each loop, keep the cheapest. Guaranteed correct, gloriously naive."
        time="O(n!) · more precisely O((n−1)!) tours, each costed in O(n)"
        space="O(n) auxiliary — one tour on the recursion stack at a time"
        pseudo={`best ← ∞
for each permutation P of cities[1..n-1]:
    tour ← [0] + P
    c ← totalCost(tour)          // O(n)
    if c < best:
        best ← c ;  bestTour ← tour
return bestTour`}
        pros={["Trivial to implement and verify", "Always optimal", "Great oracle for testing others"]}
        cons={["Factorial growth", "Unusable beyond ~11 stops", "Repeats identical sub-work constantly"]}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Tours enumerated" value={`${brute.length}`} />
          <Stat label="Optimal cost" value={`${brute[brute.length - 1]!.bestCost} km`} tone="good" />
          <Stat label="Work at n = 20" value="1.2 × 10^17" tone="bad" />
        </div>
      </AlgoCard>

      {/* 2. Held-Karp */}
      <AlgoCard
        badge="02"
        title="Held–Karp Dynamic Programming — never solve the same thing twice"
        idea="dp[S][i] = cheapest way to start at Home, visit exactly the set S, and stand at city i. Build subsets upward and reuse every answer."
        time="O(n² · 2ⁿ) — 2ⁿ subsets × n end cities × n predecessors"
        space="O(n · 2ⁿ) — the memo table itself, and this is what caps it near n ≈ 20"
        pseudo={`dp[{0}][0] ← 0
for each subset S containing 0:
    for each i in S with dp[S][i] < ∞:
        for each j not in S:
            dp[S ∪ {j}][j] ← min(dp[S ∪ {j}][j], dp[S][i] + d[i][j])
answer ← min over i of dp[V][i] + d[i][0]`}
        pros={["Exponential beats factorial by a mile", "Still exact", "Clean recurrence, easy to prove"]}
        cons={["Memory explodes: n·2ⁿ entries", "Still exponential", "Bitmask indexing limits n to word size"]}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="States filled" value={`${dp.statesComputed}`} />
          <Stat label="Relaxations" value={`${dp.relaxations}`} />
          <Stat label="Optimal tour" value={`${dp.cost} km`} tone="good" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setDpShown((s) => Math.min(s + 6, dp.entries.length))}
            className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
          >
            Fill next states ▸
          </button>
          <button
            onClick={() => setDpShown(dp.entries.length)}
            className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold hover:bg-secondary"
          >
            Fill the whole table
          </button>
          <button
            onClick={() => setDpShown(0)}
            className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold hover:bg-secondary"
          >
            ↺ Clear
          </button>
        </div>
        <div className="mt-5 max-h-72 overflow-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-left font-mono text-xs">
            <thead className="sticky top-0 bg-secondary">
              <tr>
                <th className="p-2">S (visited subset)</th>
                <th className="p-2">i (standing at)</th>
                <th className="p-2">dp[S][i]</th>
                <th className="p-2">came from</th>
              </tr>
            </thead>
            <tbody>
              {dp.entries.slice(0, dpShown).map((e, i) => (
                <tr key={i} className="border-t border-border bg-card">
                  <td className="p-2">{e.subsetLabel}</td>
                  <td className="p-2">{CITIES[e.end]!.name}</td>
                  <td className="p-2 font-bold text-primary">{e.cost}</td>
                  <td className="p-2 text-muted-foreground">
                    {e.from === null ? "—" : CITIES[e.from]!.name}
                  </td>
                </tr>
              ))}
              {dpShown === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    Table empty — press “Fill next states”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {dpShown === dp.entries.length && (
          <p className="mt-4 wobble-border border-2 border-sage/60 bg-sage/15 p-4 text-sm">
            ✅ Reconstructed optimal tour: <strong>{labelTour(dp.tour)}</strong> — {dp.cost} km, using{" "}
            {dp.statesComputed} states instead of 24 full tours. At n = 20 that’s 10^7 states versus
            10^17 tours.
          </p>
        )}
      </AlgoCard>

      {/* 3. Branch and bound */}
      <AlgoCard
        badge="03"
        title="Branch & Bound — refuse to explore hopeless routes"
        idea="Grow partial routes in a search tree. Before expanding one, compute an optimistic lower bound; if even that is worse than the best complete tour so far, cut the whole branch off."
        time="Worst case still O(n!) — if the bound never prunes, it degenerates to brute force. In practice often dramatically faster."
        space="O(n) recursion depth for DFS; more if a priority queue of live nodes is kept"
        pseudo={`best ← ∞
search(path, cost):
    if path is complete:
        best ← min(best, cost + d[last][0]) ; return
    for each unvisited city c:
        newCost  ← cost + d[last][c]
        bound    ← newCost + Σ cheapest exit edge of each remaining city
        if bound ≥ best:  continue      // prune this branch
        search(path + [c], newCost)`}
        pros={["Exact, like brute force", "Often prunes most of the tree", "Memory-light"]}
        cons={["No worst-case guarantee", "Bound quality decides everything", "Hard to predict runtime"]}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Nodes explored" value={`${bnbExplored}`} />
          <Stat label="Branches pruned" value={`${bnbPruned}`} tone="bad" />
          <Stat label="Best known" value={bnbEvent ? `${bnbEvent.bestCost === Infinity ? "∞" : bnbEvent.bestCost}` : "∞"} tone="good" />
          <Stat label="Total events" value={`${bnb.events.length}`} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setBnbShown((s) => Math.min(s + 1, bnb.events.length))}
            className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
          >
            Step the search ▸
          </button>
          <button
            onClick={() => setBnbShown(bnb.events.length)}
            className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold hover:bg-secondary"
          >
            Run to completion
          </button>
          <button
            onClick={() => setBnbShown(0)}
            className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold hover:bg-secondary"
          >
            ↺ Reset
          </button>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="max-h-72 space-y-1.5 overflow-auto rounded-xl border border-border bg-card p-3 font-mono text-xs">
            {bnb.events.slice(0, bnbShown).map((e, i) => (
              <p
                key={i}
                className={
                  e.action === "prune"
                    ? "text-destructive"
                    : e.action === "improve"
                      ? "text-sage"
                      : "text-muted-foreground"
                }
                style={{ paddingLeft: `${(e.path.length - 1) * 12}px` }}
              >
                {e.action === "prune" ? "✂" : e.action === "improve" ? "★" : "•"} {e.message}
              </p>
            ))}
            {bnbShown === 0 && <p className="text-muted-foreground">Press “Step the search”.</p>}
          </div>
          <div className="paper-card p-3">
            <CityMap tour={bnbEvent ? bnbEvent.path : [0]} closed={false} animated={false} />
            <p className="pb-1 text-center text-sm text-muted-foreground">
              The partial route currently under consideration
            </p>
          </div>
        </div>
        {bnbShown === bnb.events.length && (
          <p className="mt-4 wobble-border border-2 border-sage/60 bg-sage/15 p-4 text-sm">
            ✅ Optimal: <strong>{labelTour(bnb.tour)}</strong> — {bnb.cost} km. {bnb.pruned} branches
            were discarded without ever being finished.
          </p>
        )}
      </AlgoCard>

      {/* 4. Heuristics */}
      <AlgoCard
        badge="04"
        title="Heuristics — give up on perfect, get an answer today"
        idea="When n is in the thousands, exactness is off the table. Nearest neighbour builds a route greedily; 2-opt then repeatedly uncrosses pairs of edges until nothing improves."
        time="Nearest neighbour O(n²) · one 2-opt pass O(n²), repeated until no improvement"
        space="O(n) — just the tour array"
        pseudo={`// nearest neighbour
tour ← [0]
while tour is incomplete:
    next ← nearest unvisited city to tour.last
    tour.append(next)

// 2-opt improvement
repeat until no improvement:
    for each pair i < k:
        candidate ← reverse(tour[i..k])
        if cost(candidate) < cost(tour): tour ← candidate`}
        pros={["Runs on huge instances", "2-opt typically lands within 5% of optimal", "Simple to tune"]}
        cons={["No optimality guarantee", "Greedy start can strand a far city", "Can settle in a local minimum"]}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="paper-card p-3">
            <CityMap tour={heurTour} animated={false} />
          </div>
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat label="Heuristic cost" value={`${tourCost(heurTour)} km`} />
              <Stat
                label="Gap to optimal"
                value={`${tourCost(heurTour) - dp.cost} km`}
                tone={tourCost(heurTour) === dp.cost ? "good" : "bad"}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{heurNote}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setHeurTour(nn.tour);
                  setHeurNote(
                    `Nearest neighbour: ${nn.steps
                      .map((s) => `${CITIES[s.to]!.name} (+${s.cost})`)
                      .join(", ")}.`,
                  );
                }}
                className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
              >
                Run nearest neighbour
              </button>
              <button
                onClick={() => {
                  const r = twoOptOnce(heurTour);
                  setHeurTour(r.tour);
                  setHeurNote(
                    r.improved
                      ? `2-opt reversed a segment and saved ${r.gain} km by uncrossing edges.`
                      : "2-opt found no improving swap — this tour is 2-opt optimal (a local minimum).",
                  );
                }}
                className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold hover:bg-secondary"
              >
                Apply best 2-opt swap
              </button>
              <button
                onClick={() => {
                  setHeurTour([0, 2, 1, 4, 3]);
                  setHeurNote("A deliberately crossed tour. Try 2-opt on it.");
                }}
                className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold hover:bg-secondary"
              >
                🎀 Tangle it up
              </button>
            </div>
          </div>
        </div>
      </AlgoCard>

      {/* Complexity table */}
      <section className="mt-24">
        <h2 className="font-display text-3xl">📊 Time & space complexity, side by side</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-secondary font-mono text-xs uppercase tracking-wider">
              <tr>
                {["Algorithm", "Exact?", "Time", "Space", "Practical limit", "Work on our 5 stops"].map(
                  (h) => (
                    <th key={h} className="p-4">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[
                ["Brute force", "Yes", "O((n−1)!·n)", "O(n)", "n ≤ 11", `${brute.length} tours costed`],
                ["Held–Karp DP", "Yes", "O(n²·2ⁿ)", "O(n·2ⁿ)", "n ≤ 20", `${dp.statesComputed} states, ${dp.relaxations} relaxations`],
                ["Branch & bound", "Yes", "O(n!) worst case", "O(n) depth", "n ≈ 40–60 typical", `${bnb.explored} explored, ${bnb.pruned} pruned`],
                ["Nearest neighbour", "No", "O(n²)", "O(n)", "millions", `${nn.cost} km (gap +${nn.cost - dp.cost})`],
                ["2-opt local search", "No", "O(n²) per pass", "O(n)", "hundreds of thousands", "uncrosses edges until stable"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-border bg-card">
                  {row.map((cell, i) => (
                    <td key={i} className={`p-4 ${i >= 2 && i <= 3 ? "font-mono text-primary" : ""}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-16 wobble-border border-2 border-primary/40 bg-accent/40 p-8">
        <h2 className="font-display text-2xl">🎈 The takeaway</h2>
        <p className="mt-3 max-w-3xl text-base">
          TSP’s decision version is NP-complete: no known algorithm solves it in polynomial time, and
          finding one would settle P vs NP. So we don’t beat the problem — we out-manoeuvre it. Cache
          subproblems, prune hopeless branches, or accept an answer that’s 2% worse and a million
          times faster. That trade — certainty for speed — is the most useful idea you can take away
          from this whole journey.
        </p>
      </section>
    </div>
  );
}

function AlgoCard({
  badge,
  title,
  idea,
  time,
  space,
  pseudo,
  pros,
  cons,
  children,
}: {
  badge: string;
  title: string;
  idea: string;
  time: string;
  space: string;
  pseudo: string;
  pros: string[];
  cons: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="paper-card mt-16 p-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="rounded-full bg-primary px-3 py-1 font-mono text-xs font-bold text-primary-foreground">
          {badge}
        </span>
        <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
      </div>
      <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{idea}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <pre className="overflow-x-auto rounded-xl border border-border bg-secondary/60 p-5 font-mono text-xs leading-relaxed">
          {pseudo}
        </pre>
        <div className="space-y-3">
          <div className="rounded-xl border border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Time complexity
            </p>
            <p className="mt-1 text-sm">{time}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Space complexity
            </p>
            <p className="mt-1 text-sm">{space}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ul className="space-y-1 text-sm">
          {pros.map((p) => (
            <li key={p} className="text-sage">
              ✓ <span className="text-foreground">{p}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-1 text-sm">
          {cons.map((c) => (
            <li key={c} className="text-destructive">
              ✗ <span className="text-foreground">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 border-t border-border pt-7">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/60 p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-semibold ${
          tone === "good" ? "text-sage" : tone === "bad" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
