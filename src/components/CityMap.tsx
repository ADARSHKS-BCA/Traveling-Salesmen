import { CITIES, type City } from "@/lib/tsp";

type Props = {
  cities?: City[];
  /** Ordered tour; drawn as a closed loop when `closed` is true. */
  tour?: number[];
  closed?: boolean;
  ghostTour?: number[];
  showAllEdges?: boolean;
  selected?: number[];
  onCityClick?: (id: number) => void;
  animated?: boolean;
  className?: string;
};

export function CityMap({
  cities = CITIES,
  tour = [],
  closed = true,
  ghostTour,
  showAllEdges = false,
  selected = [],
  onCityClick,
  animated = true,
  className,
}: Props) {
  const pathOf = (t: number[], close: boolean) => {
    if (t.length < 2) return "";
    const pts = t.map((i) => cities[i]!);
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return close ? `${d} Z` : d;
  };

  const edges: [City, City][] = [];
  if (showAllEdges) {
    for (let i = 0; i < cities.length; i++)
      for (let j = i + 1; j < cities.length; j++) edges.push([cities[i]!, cities[j]!]);
  }

  return (
    <div className={className}>
      <svg
        viewBox="0 0 600 440"
        role="img"
        aria-label="Map of stops and the current route"
        className="w-full rounded-2xl bg-card"
      >
        <defs>
          <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" className="fill-border" />
          </pattern>
        </defs>
        <rect width="600" height="440" fill="url(#dots)" />

        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className="stroke-border"
            strokeWidth={1.5}
            strokeDasharray="4 6"
          />
        ))}

        {ghostTour && ghostTour.length > 1 && (
          <path
            d={pathOf(ghostTour, closed)}
            fill="none"
            className="stroke-sage"
            strokeWidth={7}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.35}
          />
        )}

        {tour.length > 1 && (
          <path
            d={pathOf(tour, closed)}
            fill="none"
            className={`stroke-primary ${animated ? "route-dash" : ""}`}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {cities.map((c, idx) => {
          const order = tour.indexOf(c.id);
          const isSelected = selected.includes(c.id);
          return (
            <g
              key={c.id}
              onClick={() => onCityClick?.(c.id)}
              className={onCityClick ? "cursor-pointer" : undefined}
              style={{ transformOrigin: `${c.x}px ${c.y}px` }}
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={isSelected ? 27 : 23}
                className={
                  isSelected
                    ? "fill-honey stroke-primary"
                    : "fill-card stroke-border hover:stroke-primary"
                }
                strokeWidth={3}
              />
              <text
                x={c.x}
                y={c.y + 7}
                textAnchor="middle"
                fontSize="20"
                style={{ pointerEvents: "none" }}
              >
                {c.emoji}
              </text>
              <text
                x={c.x}
                y={c.y + 46}
                textAnchor="middle"
                className="fill-foreground font-sans"
                fontSize="13"
                fontWeight={700}
                style={{ pointerEvents: "none" }}
              >
                {c.name}
                {order >= 0 ? ` · ${order + 1}` : ""}
              </text>
              {idx === 0 && (
                <text
                  x={c.x}
                  y={c.y - 34}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono"
                  fontSize="11"
                  style={{ pointerEvents: "none" }}
                >
                  start
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
