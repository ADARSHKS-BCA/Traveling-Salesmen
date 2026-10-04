import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CityMap } from "@/components/CityMap";
import { NextStep } from "@/components/site/JourneyNav";
import { CITIES, MATRIX, bruteForceSteps, labelTour, tourCost } from "@/lib/tsp";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Build a Tour — Interactive TSP Simulation" },
      {
        name: "description",
        content:
          "Plan a route by hand across five stops, then watch an exhaustive search check all 24 tours and reveal the optimal one.",
      },
      { property: "og:title", content: "Build a Tour — Interactive TSP Simulation" },
      {
        property: "og:description",
        content: "Hands-on TSP: build your own route, then race it against exhaustive search.",
      },
    ],
  }),
  component: SimulationPage,
});

function SimulationPage() {
  const steps = useMemo(() => bruteForceSteps(), []);
  const optimal = steps[steps.length - 1]!;

  /* --- player route --- */
  const [route, setRoute] = useState<number[]>([0]);
  const complete = route.length === CITIES.length;
  const playerCost = complete ? tourCost(route) : 0;
  const partialCost = route
    .slice(1)
    .reduce((acc, c, i) => acc + MATRIX[route[i]!]![c]!, 0);

  const pick = (id: number) => {
    if (route.includes(id)) return;
    setRoute((r) => (r.length < CITIES.length ? [...r, id] : r));
  };

  /* --- brute force playback --- */
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIdx((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 450);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, steps.length]);

  const cur = steps[idx]!;
  const finished = idx === steps.length - 1;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-14">
      <header className="max-w-3xl animate-pop-in">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Step three · playtime
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Your turn. Can you beat the <span className="ink-underline">machine</span>?
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Five stops, 24 possible loops. Plan a route with your eyes first — then let the computer
          grind through every single one.
        </p>
      </header>

      {/* Player */}
      <section className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="paper-card p-4">
          <CityMap tour={route} closed={complete} onCityClick={pick} selected={route} />
        </div>
        <div className="paper-card flex flex-col p-7">
          <h2 className="font-display text-2xl">🖐️ Plan it by hand</h2>
          <p className="mt-2 text-muted-foreground">
            Tap stops in the order you’d visit them. You start at Home 🏠 and return there
            automatically.
          </p>
          <div className="mt-5 rounded-xl bg-secondary p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Your route
            </p>
            <p className="mt-1 font-display text-lg">
              {route.map((i) => CITIES[i]!.name).join(" → ")}
              {complete ? " → Home" : " → …"}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label="Distance so far" value={`${complete ? playerCost : partialCost} km`} />
            <Stat
              label={complete ? "Versus optimal" : "Stops left"}
              value={
                complete
                  ? playerCost === optimal.bestCost
                    ? "Perfect! 🎉"
                    : `+${playerCost - optimal.bestCost} km`
                  : `${CITIES.length - route.length}`
              }
              tone={complete && playerCost === optimal.bestCost ? "good" : "normal"}
            />
          </div>
          {complete && (
            <p className="mt-4 wobble-border border-2 border-primary/40 bg-accent/40 p-4 text-sm">
              {playerCost === optimal.bestCost
                ? "You found the optimal tour by intuition. On five stops that's doable — on twenty it isn't, and that's the whole problem."
                : `Close! The best possible loop costs ${optimal.bestCost} km. Run the search below to see it.`}
            </p>
          )}
          <button
            onClick={() => setRoute([0])}
            className="mt-auto self-start rounded-full border border-border bg-card px-5 py-2.5 font-semibold transition-colors hover:bg-secondary"
          >
            ↺ Start over
          </button>
        </div>
      </section>

      {/* Brute force sim */}
      <section className="mt-24">
        <h2 className="font-display text-3xl">🔍 Now watch the exhaustive search</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          The simplest possible strategy: try every ordering, keep the best. Twenty-four tours here —
          instant. Remember that number as we scale up.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="paper-card p-4">
            <CityMap tour={cur.tour} ghostTour={cur.bestTour} animated={false} />
            <p className="px-3 pb-2 text-center text-sm text-muted-foreground">
              Solid line = tour being tested · faded green = best found so far
            </p>
          </div>

          <div className="paper-card flex flex-col p-7">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Tours checked" value={`${idx + 1} / ${steps.length}`} />
              <Stat label="This tour" value={`${cur.cost} km`} />
              <Stat label="Best so far" value={`${cur.bestCost} km`} tone="good" />
              <Stat
                label="Search space"
                value={`(5−1)! = 24`}
              />
            </div>

            <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
              />
            </div>

            <p className="mt-4 font-mono text-sm">{labelTour(cur.tour)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {cur.isNewBest ? "✨ New best tour found!" : "Not an improvement — discarded."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={finished}
                className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-40"
              >
                {playing ? "⏸ Pause" : "▶ Run search"}
              </button>
              <button
                onClick={() => setIdx((i) => Math.min(i + 1, steps.length - 1))}
                disabled={finished}
                className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold transition-colors hover:bg-secondary disabled:opacity-40"
              >
                Step ▸
              </button>
              <button
                onClick={() => {
                  setPlaying(false);
                  setIdx(0);
                }}
                className="rounded-full border border-border bg-card px-5 py-2.5 font-semibold transition-colors hover:bg-secondary"
              >
                ↺ Reset
              </button>
            </div>

            {finished && (
              <p className="mt-5 wobble-border border-2 border-sage/60 bg-sage/15 p-4 text-sm">
                🏁 All 24 tours checked. Optimal loop:{" "}
                <strong>{labelTour(optimal.bestTour)}</strong> at {optimal.bestCost} km.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-20 paper-card p-8">
        <h2 className="font-display text-2xl">😅 So why not always do this?</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          The search you just watched took 24 steps. Add five more stops and it becomes 362,880. Add
          another five and it’s 87 billion. Exhaustive search is correct and completely useless past
          about a dozen stops — which is exactly why smarter algorithms exist.
        </p>
      </section>

      <NextStep
        to="/algorithms"
        label="Next: the real algorithms"
        hint="You've felt the explosion. Now meet the algorithms that fight back."
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "good";
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/60 p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-semibold ${
          tone === "good" ? "text-sage" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
