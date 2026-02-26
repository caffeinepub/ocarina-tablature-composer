import React from 'react';

interface OcarinaVisualProps {
  /** Hole states: true = covered/open, false = uncovered/closed. Accepts 4 values for 2x2 layout. */
  holeStates?: boolean[];
  /** Alias for holeStates — either prop name is accepted */
  fingeringPattern?: boolean[];
  onHoleClick?: (index: number) => void;
  interactive?: boolean;
  customImageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

// 4-hole 2x2 parallel layout positions (normalized 0-1)
const HOLE_POSITIONS = [
  { x: 0.35, y: 0.38, label: 'TL' }, // top-left
  { x: 0.65, y: 0.38, label: 'TR' }, // top-right
  { x: 0.35, y: 0.62, label: 'BL' }, // bottom-left
  { x: 0.65, y: 0.62, label: 'BR' }, // bottom-right
];

const SIZE_MAP = {
  sm: { width: 80, height: 60 },
  md: { width: 140, height: 105 },
  lg: { width: 200, height: 150 },
};

export default function OcarinaVisual({
  holeStates,
  fingeringPattern,
  onHoleClick,
  interactive = false,
  customImageUrl,
  size = 'md',
  showLabels = false,
  className = '',
}: OcarinaVisualProps) {
  const { width, height } = SIZE_MAP[size];
  const holeRadius = size === 'sm' ? 6 : size === 'md' ? 10 : 14;

  // Accept either holeStates or fingeringPattern prop
  const rawPattern = holeStates ?? fingeringPattern ?? [];

  // Ensure exactly 4 holes
  const pattern = [...rawPattern].slice(0, 4);
  while (pattern.length < 4) pattern.push(false);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={`ov-body-${size}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#d4a96a" />
          <stop offset="60%" stopColor="#b8843a" />
          <stop offset="100%" stopColor="#8b5e2a" />
        </radialGradient>
        <radialGradient id={`ov-hole-open-${size}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3a2510" />
          <stop offset="100%" stopColor="#1a0e05" />
        </radialGradient>
      </defs>

      {/* Ocarina body */}
      <ellipse
        cx={width * 0.5}
        cy={height * 0.5}
        rx={width * 0.46}
        ry={height * 0.44}
        fill={`url(#ov-body-${size})`}
        stroke="#7a4e20"
        strokeWidth="1.5"
      />

      {/* Body highlight */}
      <ellipse
        cx={width * 0.42}
        cy={height * 0.32}
        rx={width * 0.18}
        ry={height * 0.1}
        fill="rgba(255,220,150,0.25)"
      />

      {/* Mouthpiece line */}
      <line
        x1={width * 0.96}
        y1={height * 0.42}
        x2={width * 0.96}
        y2={height * 0.58}
        stroke="#5a3510"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* 4 holes in 2x2 grid */}
      {HOLE_POSITIONS.map((pos, i) => {
        const cx = pos.x * width;
        const cy = pos.y * height;
        const isCovered = pattern[i] === true;

        return (
          <g
            key={i}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onClick={() => interactive && onHoleClick && onHoleClick(i)}
          >
            {/* Shadow */}
            <circle cx={cx + 1} cy={cy + 1} r={holeRadius} fill="rgba(0,0,0,0.25)" />
            {/* Hole */}
            {isCovered ? (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={holeRadius}
                  fill={`url(#ov-hole-open-${size})`}
                  stroke="#3a2510"
                  strokeWidth="1.5"
                />
                <circle
                  cx={cx - holeRadius * 0.25}
                  cy={cy - holeRadius * 0.25}
                  r={holeRadius * 0.3}
                  fill="rgba(80,40,10,0.4)"
                />
              </>
            ) : (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={holeRadius}
                  fill="#c49040"
                  stroke="#7a4e20"
                  strokeWidth="1.5"
                />
                <circle
                  cx={cx - holeRadius * 0.2}
                  cy={cy - holeRadius * 0.2}
                  r={holeRadius * 0.35}
                  fill="rgba(220,170,80,0.5)"
                />
              </>
            )}
            {showLabels && (
              <text
                x={cx}
                y={cy + holeRadius + 8}
                textAnchor="middle"
                fontSize="7"
                fill="#5a3510"
                fontFamily="sans-serif"
              >
                {i + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export { OcarinaVisual };
