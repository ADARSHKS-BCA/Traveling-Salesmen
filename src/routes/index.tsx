import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CityMap } from "@/components/CityMap";
import { NextStep } from "@/components/site/JourneyNav";
import { CITIES, MATRIX, factorial, formatBig, tourCost } from "@/lib/tsp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Travelling Salesman Problem — A Warm Introduction" },
      {
        name: "description",
        content:
          "Start here: what the Travelling Salesman Problem is, where it came from, and why picking the best route is so surprisingly hard.",
      },
      { property: "og:title", content: "The Travelling Salesman Problem — A Warm Introduction" },
      {
        property: "og:description",
        content: "A friendly, illustrated walk through TSP: the story, the rules, and why it explodes.",
      },
    ],
  }),
  component: ProblemPage,
});

const RULES = [
  { emoji: "📍", title: "Visit every stop", body: "Nobody gets left off the list. Every pin must be reached." },
  { emoji: "☝️", title: "Visit each one once", body: "No looping back for a second croissant. One visit each." },
  { emoji: "🏠", title: "Come back home", body: "The trip ends exactly where the morning started." },
  { emoji: "🪙", title: "Spend as little as possible", body: "Of all the trips that follow the rules, find the cheapest." },
];

function ProblemPage() {
  const [tour, setTour] = useState<number[]>([0, 1, 2, 3, 4]);

  const shuffle = () => {
    const rest = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    setTour([0, ...rest]);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-14">
      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-pop-in">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Chapter one · the story
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] sm:text-5xl">
            A salesman, a satchel, and a <span className="ink-underline">deceptively simple</span>{" "}
            question.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            In 1832 a German handbook advised travelling salesmen to plan their tours carefully — “the
            most important thing,” it said, “is to cover as many locations as possible without
            visiting any twice.” Nobody realised they had written down one of the hardest questions
            in computer science.
          </p>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            You do this every day: errands, deliveries, a holiday itinerary. Given a handful of
            stops, what order makes the trip shortest?
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={shuffle}
              className="rounded-full bg-primary px-6 py-3 font-display text-base font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
            >
              🎲 Shuffle the errands
            </button>
            <a
              href="#why-hard"
              className="rounded-full border border-border bg-card px-6 py-3 font-display text-base font-semibold transition-colors hover:bg-secondary"
            >
              Why is it hard?
            </a>
          </div>
        </div>

        <div className="paper-card animate-float-soft p-4" style={{ ["--tilt" as string]: "-1deg" }}>
          <CityMap tour={tour} />
          <div className="flex items-center justify-between px-3 py-3">
            <p className="text-sm text-muted-foreground">A morning of errands around town</p>
            <p className="font-mono text-sm font-bold text-primary">
              {tourCost(tour)} km
            </p>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="mt-28">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Chapter two · the rules
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">
          Given some stops and the cost of travelling between them, find the cheapest loop that
          visits each stop once.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r, i) => (
            <div
              key={r.title}
              className="paper-card p-6 transition-transform hover:-translate-y-1"
              style={{ rotate: `${(i % 2 === 0 ? -1 : 1) * 0.7}deg` }}
            >
              <span className="text-3xl" aria-hidden>
                {r.emoji}
              </span>
              <h3 className="mt-3 font-display text-lg">{r.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why hard */}
      <section id="why-hard" className="mt-28 scroll-mt-24">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Chapter three · the twist
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl">
          Finding <em>a</em> route is easy. Finding <em>the best</em> route is where things get wild.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Add one more stop and the number of possible tours doesn’t grow a bit — it multiplies. This
          is the combinatorial explosion, and it is the whole reason TSP is famous.
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-y-2 text-left">
            <thead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Stops</th>
                <th className="px-4 py-2">Possible tours (n−1)!</th>
                <th className="px-4 py-2">A computer at 1 million tours/sec</th>
              </tr>
            </thead>
            <tbody>
              {[5, 10, 15, 20, 25].map((n) => {
                const tours = factorial(n - 1);
                const seconds = tours / 1e6;
                const human =
                  seconds < 60
                    ? `${seconds.toFixed(4)} seconds`
                    : seconds < 3.15e7
                      ? `${(seconds / 86400).toFixed(1)} days`
                      : `${formatBig(Math.round(seconds / 3.15e7))} years`;
                return (
                  <tr key={n} className="bg-card">
                    <td className="rounded-l-xl border border-r-0 border-border px-4 py-3 font-bold">
                      {n}
                    </td>
                    <td className="border-y border-border px-4 py-3 font-mono text-sm text-primary">
                      {formatBig(tours)}
                    </td>
                    <td className="rounded-r-xl border border-l-0 border-border px-4 py-3 text-sm text-muted-foreground">
                      {human}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 wobble-border border-2 border-primary/40 bg-accent/40 p-6">
          <p className="text-base">
            <strong>The punchline:</strong> at 25 stops there are more possible tours than there are
            grains of sand on Earth. No computer will ever try them all. So the real question becomes:{" "}
            <em>how do we search cleverly instead of exhaustively?</em>
          </p>
        </div>
      </section>

      {/* Where it shows up */}
      <section className="mt-28">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          Chapter four · why anyone cares
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">It hides inside ordinary things.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { e: "🚚", t: "Parcel delivery" },
            { e: "🤖", t: "Robot arms" },
            { e: "🔩", t: "Drilling circuit boards" },
            { e: "🧬", t: "Genome sequencing" },
            { e: "🛰️", t: "Satellite scheduling" },
            { e: "🎒", t: "Your weekend plans" },
          ].map((a, i) => (
            <div
              key={a.t}
              className="paper-card animate-float-soft p-5 text-center"
              style={{ animationDelay: `${i * 0.35}s` }}
            >
              <div className="text-3xl" aria-hidden>
                {a.e}
              </div>
              <p className="mt-2 text-sm font-semibold">{a.t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 paper-card p-8">
        <h2 className="font-display text-2xl">Our tiny town, for the rest of the journey</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Five stops is small enough to see everything and big enough to be interesting: 4! = 24
          possible tours. Every page from here uses this same map.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold"
            >
              {c.emoji} {c.name}
            </span>
          ))}
          <span className="rounded-full border border-border bg-secondary px-4 py-2 font-mono text-sm">
            Home → Bakery = {MATRIX[0]![1]} km
          </span>
        </div>
      </section>

      <NextStep
        to="/setup"
        label="Next: how we write this down"
        hint="You know the problem. Now let's give it a shape a computer can hold."
      />
    </div>
  );
}
