import { Link } from "@tanstack/react-router";

const STEPS = [
  { to: "/", label: "The Problem", emoji: "🧭" },
  { to: "/setup", label: "The Setup", emoji: "🧰" },
  { to: "/simulation", label: "Play With It", emoji: "🎠" },
  { to: "/algorithms", label: "The Algorithms", emoji: "⚙️" },
] as const;

export function JourneyNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Link to="/" className="font-display text-lg font-semibold">
          <span className="mr-2">🗺️</span>
          The Travelling Salesman
        </Link>
        <ul className="ml-auto flex flex-wrap items-center gap-1.5 text-sm">
          {STEPS.map((s, i) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeOptions={{ exact: s.to === "/" }}
                activeProps={{
                  className:
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold bg-primary text-primary-foreground",
                }}
              >
                <span aria-hidden>{s.emoji}</span>
                <span className="hidden sm:inline">
                  {i + 1}. {s.label}
                </span>
                <span className="sm:hidden">{i + 1}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function NextStep({
  to,
  label,
  hint,
}: {
  to: "/" | "/setup" | "/simulation" | "/algorithms";
  label: string;
  hint: string;
}) {
  return (
    <div className="mx-auto mt-20 max-w-3xl text-center">
      <p className="text-muted-foreground">{hint}</p>
      <Link
        to={to}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-lg font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
      >
        {label} <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
