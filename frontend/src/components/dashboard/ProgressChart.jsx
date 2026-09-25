import { useId, useMemo, useState } from "react";

// A hand-rolled single-series line chart -- no charting library in this
// project yet, and one series doesn't need one. Built to the dataviz
// skill's spec: 2px round-joined line, >=8px markers with a 2px
// surface-color ring, hairline recessive gridlines, no legend box (a single
// series names itself in the title), a crosshair + tooltip hover layer with
// keyboard-focus parity, and an accessible table-view fallback.
const WIDTH = 600;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 34 };
const Y_TICKS = [0, 25, 50, 75, 100];
const LINE_COLOR = "#4f46e5"; // brand-600

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function ProgressChart({ sessions }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const points = useMemo(() => {
    return sessions
      .filter((session) => typeof session.score === "number")
      .map((session) => ({
        id: session.id,
        date: session.created_at,
        score: session.score,
        role: session.role,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions]);

  // Need at least two scored interviews for a trend to mean anything.
  if (points.length < 2) return null;

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;

  const xFor = (index) => PAD.left + (index / (points.length - 1)) * innerWidth;
  const yFor = (score) => PAD.top + innerHeight * (1 - Math.min(100, Math.max(0, score)) / 100);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.score).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1).toFixed(1)} ${(PAD.top + innerHeight).toFixed(1)} L ${xFor(0).toFixed(1)} ${(PAD.top + innerHeight).toFixed(1)} Z`;

  const first = points[0];
  const latest = points[points.length - 1];
  const delta = Math.round((latest.score - first.score) * 10) / 10;

  // Cap x-axis labels at ~6 so a long history doesn't collide into mush.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  const nearestIndexForClientX = (svg, clientX) => {
    const rect = svg.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const dist = Math.abs(xFor(i) - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    return nearest;
  };

  const handlePointerMove = (event) => {
    setHoverIndex(nearestIndexForClientX(event.currentTarget, event.clientX));
  };

  const tooltipLeftPct = hovered ? (xFor(hoverIndex) / WIDTH) * 100 : 0;
  const tooltipTopPct = hovered ? (yFor(hovered.score) / HEIGHT) * 100 : 0;

  return (
    <div className="card mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Progress over time</h3>
          <p className="text-xs text-slate-500">Feedback score across your completed interviews</p>
        </div>
        <div className="flex items-start gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{Math.round(latest.score)}</p>
            {delta !== 0 ? (
              <p className={`text-xs font-semibold ${delta > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {delta > 0 ? "+" : ""}
                {delta} since your first scored interview
              </p>
            ) : (
              <p className="text-xs text-slate-400">Latest score</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowTable((current) => !current)}
            className="flex-none text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {showTable ? "View as chart" : "View as table"}
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Date
                </th>
                <th scope="col" className="px-3 py-2">
                  Role
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {points.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 text-slate-600">{formatFullDate(p.date)}</td>
                  <td className="px-3 py-2 text-slate-900">{p.role}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">{Math.round(p.score)}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-4">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full touch-none"
            role="img"
            aria-label={`Line chart of your feedback score from ${formatDate(first.date)} to ${formatDate(
              latest.date
            )}. Latest score ${Math.round(latest.score)} out of 100.`}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.12" />
                <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines -- hairline, solid, one-step-off-surface gray */}
            {Y_TICKS.map((tick) => (
              <g key={tick}>
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeWidth="1" />
                <text x={PAD.left - 8} y={yFor(tick)} textAnchor="end" dominantBaseline="middle" fontSize="9" className="fill-slate-400">
                  {tick}
                </text>
              </g>
            ))}

            {/* X-axis date labels, thinned so they never collide */}
            {points.map((p, i) =>
              i % labelEvery === 0 || i === points.length - 1 ? (
                <text key={p.id} x={xFor(i)} y={HEIGHT - 8} textAnchor="middle" fontSize="9" className="fill-slate-400">
                  {formatDate(p.date)}
                </text>
              ) : null
            )}

            {/* Area wash under the line -- series hue at ~10% opacity */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* The line -- 2px, round join/cap */}
            <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {/* Crosshair -- finds the X, snaps to the nearest point */}
            {hovered && (
              <line
                x1={xFor(hoverIndex)}
                x2={xFor(hoverIndex)}
                y1={PAD.top}
                y2={PAD.top + innerHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}

            {/* Markers -- >=8px, series-colored fill, 2px surface ring; the
                endpoint carries a direct label (the one point worth calling
                out per the "label selectively" rule). Each also has a
                transparent >=24px hit target so hover/focus never has to be
                pixel-perfect, and is independently focusable for keyboard
                parity with pointer hover. */}
            {points.map((p, i) => {
              const isLast = i === points.length - 1;
              const isActive = hoverIndex === i;
              return (
                <g key={p.id}>
                  <circle
                    cx={xFor(i)}
                    cy={yFor(p.score)}
                    r={isActive ? 6 : 4}
                    fill={LINE_COLOR}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {isLast && (
                    <text
                      x={xFor(i)}
                      y={yFor(p.score) - 12}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="700"
                      className="fill-slate-700"
                    >
                      {Math.round(p.score)}
                    </text>
                  )}
                  <circle
                    cx={xFor(i)}
                    cy={yFor(p.score)}
                    r={12}
                    fill="transparent"
                    tabIndex={0}
                    role="img"
                    aria-label={`${formatFullDate(p.date)}, ${p.role}, score ${Math.round(p.score)} out of 100`}
                    onFocus={() => setHoverIndex(i)}
                    onBlur={() => setHoverIndex((current) => (current === i ? null : current))}
                    onPointerEnter={() => setHoverIndex(i)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{ left: `${tooltipLeftPct}%`, top: `${tooltipTopPct}%` }}
            >
              <p className="font-bold">{Math.round(hovered.score)}/100</p>
              <p className="text-slate-300">
                {hovered.role} &middot; {formatDate(hovered.date)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProgressChart;
