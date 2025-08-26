import React from "react";
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import "./LegacyTuningChart.css";

/**
 * Fixed 0–750 Hz chart with:
 * - Major ticks every 100 Hz (labeled)
 * - Minor grid every 50 Hz (subtle)
 * - Optional sweet-spot bands (low / legacy / high)
 * - Fundamental vertical marker
 * - Color legend
 */
const LegacyTuningChart = ({
  fundamentalHz,
  sweetSpots = [],
  palette = {
    fundamental: "var(--lt-fundamental)",
    low: "var(--lt-low)",
    legacy: "var(--lt-legacy)",
    high: "var(--lt-high)",
  },
  size = "md",
  constrain = true,
  className = "",
  showBands = true,
  showFundamental = true,
  showLegend = true,
  maxWidth = 1040,
  minWidth = 720,
  majorStep = 100,
  minorStep = 50,
}) => {
  const DOMAIN_MIN = 0;
  const DOMAIN_MAX = 750;

  // Minimal dataset to anchor the numeric X axis
  const data = [{ x: DOMAIN_MIN }, { x: DOMAIN_MAX }];

  const sizeClass =
    size === "sm" ? "is-sm" : size === "lg" ? "is-lg" : size === "xl" ? "is-xl" : "";

  const Wrapper = ({ children }) =>
    constrain ? (
      <div
        className="legacy-tuning-chart-wrap"
        style={{ maxWidth: `${maxWidth}px`, minWidth: `${minWidth}px` }}
      >
        {children}
      </div>
    ) : (
      <div className="legacy-tuning-chart-unconstrained">{children}</div>
    );

  const isNum = (v) => typeof v === "number" && isFinite(v);
  const inRange =
    isNum(fundamentalHz) && fundamentalHz >= DOMAIN_MIN && fundamentalHz <= DOMAIN_MAX;

  const bandColor = (id) =>
    id === "low"
      ? palette.low
      : id === "legacy"
      ? palette.legacy
      : id === "high"
      ? palette.high
      : palette.legacy;

  const makeTicks = (step) => {
    const arr = [];
    for (let v = DOMAIN_MIN; v <= DOMAIN_MAX; v += step)
      arr.push(Number(v.toFixed(6)));
    return arr;
  };

  const majorTicks = makeTicks(majorStep); // labeled
  const minorTicks = makeTicks(minorStep); // subtle grid
  const minorOnly = minorTicks.filter((t) => !majorTicks.includes(t));

  return (
    <Wrapper>
      <div
        className={`legacy-tuning-chart ${sizeClass} ${className}`}
        aria-label="Legacy Tuning Frequency Chart"
      >
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 18, right: 12, bottom: 36, left: 12 }}
          >
            {/* Minor grid behind (lighter) */}
            <CartesianGrid
              verticalPoints={minorOnly}
              strokeDasharray="2 4"
              stroke="var(--lt-grid-soft)"
            />
            {/* Major grid */}
            <CartesianGrid strokeDasharray="3 3" />

            {/* Sweet-spot bands */}
            {showBands &&
              sweetSpots
                .filter((b) => isNum(b?.loHz) && isNum(b?.hiHz))
                .map((b) => {
                  const x1 = Math.max(DOMAIN_MIN, Number(b.loHz));
                  const x2 = Math.min(DOMAIN_MAX, Number(b.hiHz));
                  if (!(x2 > x1)) return null;
                  const fill = bandColor(b.id);
                  return (
                    <ReferenceArea
                      key={`${b.id}-${x1}-${x2}`}
                      x1={x1}
                      x2={x2}
                      y1={0}
                      y2={1}
                      ifOverflow="extendDomain"
                      fill={fill}
                      fillOpacity={0.10}
                      stroke={fill}
                      strokeDasharray="5 6"
                      strokeOpacity={0.55}
                    />
                  );
                })}

            {/* X axis */}
            <XAxis
              type="number"
              dataKey="x"
              allowDataOverflow
              domain={[DOMAIN_MIN, DOMAIN_MAX]}
              ticks={majorTicks}
              interval={0}
              tick={{ fontSize: 12.5 }}
              label={{ value: "Frequency (Hz)", position: "insideBottom", dy: 12 }}
            />
            <YAxis hide />

            {/* Fundamental marker */}
            {showFundamental && inRange && (
              <ReferenceLine
                x={fundamentalHz}
                stroke={palette.fundamental || "var(--lt-fundamental)"}
                strokeWidth={2}
                ifOverflow="hidden"
                label={{
                  value: `${fundamentalHz.toFixed(1)} Hz`,
                  position: "insideTop",
                  dy: 10, // push a bit down from the top grid
                  fill: "var(--lt-text)",
                  fontSize: 11.5,
                  fontWeight: 600,
                }}
              />
            )}

            <Tooltip
              isAnimationActive={false}
              formatter={(val, name) => [val, name]}
              labelFormatter={(lab) => `Frequency: ${Number(lab).toFixed(1)} Hz`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="lt-legend" aria-label="Legend">
          <div className="lt-chip">
            <span className="lt-dot lt-dot--fundamental" />
            <span className="lt-chip-label">Shell Fundamental</span>
          </div>
          <div className="lt-chip">
            <span className="lt-dot lt-dot--low" />
            <span className="lt-chip-label">Low Sweet Spot</span>
          </div>
          <div className="lt-chip">
            <span className="lt-dot lt-dot--legacy" />
            <span className="lt-chip-label">LegacyPrint™</span>
          </div>
          <div className="lt-chip">
            <span className="lt-dot lt-dot--high" />
            <span className="lt-chip-label">High Sweet Spot</span>
          </div>
        </div>
      )}

      {/* Dev-only quick readout; remove if you prefer */}
      {process.env.NODE_ENV !== "production" && (
        <div className="lt-debug">
          debug → fundamental: {inRange ? fundamentalHz.toFixed(2) : "—"} | bands:{" "}
          {sweetSpots.length}
        </div>
      )}
    </Wrapper>
  );
};

export default LegacyTuningChart;