function makePath(
  values,
  width,
  height,
  left,
  top,
  bottom,
  maxValue
) {
  if (!values.length) return "";

  const usableWidth = width - left - 18;
  const usableHeight = height - top - bottom;

  const step =
    values.length > 1
      ? usableWidth / (values.length - 1)
      : 0;

  return values
    .map((value, index) => {
      const x = left + index * step;

      const y =
        top +
        usableHeight -
        (Number(value || 0) / maxValue) *
          usableHeight;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(
        1
      )} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function compactMoney(value) {
  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(1)}m`;
  }

  if (value >= 1_000) {
    return `₦${Math.round(value / 1_000)}k`;
  }

  return `₦${Math.round(value)}`;
}

export default function SalesChart({ data = [] }) {
  const width = 760;
  const height = 260;
  const left = 58;
  const top = 18;
  const bottom = 32;

  const values = data.map((item) =>
    Number(item.total || 0)
  );

  const rawMax = Math.max(...values, 0);

  const maxValue = Math.max(
    Math.ceil(rawMax / 10000) * 10000,
    10000
  );

  const linePath = makePath(
    values,
    width,
    height,
    left,
    top,
    bottom,
    maxValue
  );

  const areaPath = linePath
    ? `${linePath} L ${width - 18} ${
        height - bottom
      } L ${left} ${height - bottom} Z`
    : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(
    (ratio) => maxValue * ratio
  );

  if (!data.length) {
    return (
      <div className="grid h-64 place-items-center text-sm text-gray-400">
        No paid sales yet.
      </div>
    );
  }

  return (
    <div className="min-w-[620px]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        role="img"
        aria-label="Real sales chart"
      >
        <defs>
          <linearGradient
            id="salesFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#FB1F81"
              stopOpacity="0.24"
            />

            <stop
              offset="100%"
              stopColor="#FB1F81"
              stopOpacity="0.02"
            />
          </linearGradient>
        </defs>

        {ticks.map((value) => {
          const y =
            top +
            (1 - value / maxValue) *
              (height - top - bottom);

          return (
            <g key={value}>
              <line
                x1={left}
                y1={y}
                x2={width - 18}
                y2={y}
                stroke="#f1f5f9"
              />

              <text
                x="0"
                y={y + 4}
                className="fill-gray-400 text-[11px]"
              >
                {compactMoney(value)}
              </text>
            </g>
          );
        })}

        <path
          d={areaPath}
          fill="url(#salesFill)"
        />

        <path
          d={linePath}
          fill="none"
          stroke="#FB1F81"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((item, index) => {
          const x =
            left +
            index *
              ((width - left - 18) /
                Math.max(data.length - 1, 1));

          const y =
            top +
            (height - top - bottom) -
            (Number(item.total || 0) / maxValue) *
              (height - top - bottom);

          return (
            <circle
              key={item.key || item.date || index}
              cx={x}
              cy={y}
              r="3.5"
              fill="#fff"
              stroke="#FB1F81"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <div className="flex justify-between px-[58px] text-xs text-gray-400">
        {data
          .filter(
            (_, index) =>
              index === 0 ||
              index === data.length - 1 ||
              index %
                Math.max(
                  Math.ceil(data.length / 5),
                  1
                ) ===
                0
          )
          .map((item, index) => (
            <span
              key={item.key || item.date || index}
            >
              {item.label}
            </span>
          ))}
      </div>
    </div>
  );
}