import React from 'react';
import type { HoleLayout } from '../backend';
import { getDefaultFingeringPattern } from '../hooks/useQueries';

interface TablatureSymbolProps {
  noteName?: string;
  noteOctave?: number;
  /** Fingering pattern: 4 booleans for 2x2 hole layout */
  fingeringPattern?: boolean[];
  /** Legacy alias for fingeringPattern */
  pattern?: boolean[];
  /** Custom hole layout (uses default 2x2 if not provided or not 4 holes) */
  customLayout?: HoleLayout[] | null;
  /** Size: named variant or legacy numeric px width */
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
}

// 4-hole 2x2 parallel layout
const HOLE_GRID = [
  { col: 0, row: 0 }, // top-left
  { col: 1, row: 0 }, // top-right
  { col: 0, row: 1 }, // bottom-left
  { col: 1, row: 1 }, // bottom-right
];

// Default hole positions for custom layout fallback
const DEFAULT_HOLE_LAYOUT: HoleLayout[] = [
  { position: { x: 0.35, y: 0.38 }, size: 0.06 },
  { position: { x: 0.65, y: 0.38 }, size: 0.06 },
  { position: { x: 0.35, y: 0.62 }, size: 0.06 },
  { position: { x: 0.65, y: 0.62 }, size: 0.06 },
];

function resolveSize(size: 'sm' | 'md' | 'lg' | number | undefined): { cellSize: number; gap: number; holeR: number; fontSize: number; padding: number } {
  if (size === 'sm' || size === undefined) {
    return { cellSize: 10, gap: 3, holeR: 4, fontSize: 8, padding: 4 };
  }
  if (size === 'md') {
    return { cellSize: 14, gap: 4, holeR: 5, fontSize: 10, padding: 6 };
  }
  if (size === 'lg') {
    return { cellSize: 18, gap: 5, holeR: 7, fontSize: 12, padding: 8 };
  }
  // Numeric size: treat as pixel width, scale proportionally
  const scale = (size as number) / 36;
  return {
    cellSize: Math.round(10 * scale),
    gap: Math.round(3 * scale),
    holeR: Math.max(2, Math.round(4 * scale)),
    fontSize: Math.round(8 * scale),
    padding: Math.round(4 * scale),
  };
}

export const TablatureSymbol: React.FC<TablatureSymbolProps> = ({
  noteName,
  noteOctave,
  fingeringPattern,
  pattern,
  customLayout,
  size,
  className = '',
}) => {
  const cfg = resolveSize(size);

  // Resolve hole states: prefer fingeringPattern, then pattern, then default
  const resolvedPattern = fingeringPattern ?? pattern ?? (noteName ? getDefaultFingeringPattern(noteName) : getDefaultFingeringPattern());

  // Ensure exactly 4 holes
  const holeStates = [...resolvedPattern].slice(0, 4);
  while (holeStates.length < 4) holeStates.push(false);

  // Use custom layout if it has exactly 4 holes, otherwise use grid
  const useCustomLayout = customLayout && customLayout.length === 4;

  const cols = 2;
  const rows = 2;
  const gridW = cols * cfg.cellSize + (cols - 1) * cfg.gap;
  const gridH = rows * cfg.cellSize + (rows - 1) * cfg.gap;
  const labelH = noteName ? cfg.fontSize + 4 : 0;
  const svgW = gridW + cfg.padding * 2;
  const svgH = gridH + cfg.padding * 2 + labelH;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={`inline-block ${className}`}
      aria-label={noteName ? `${noteName}${noteOctave ?? ''}` : 'Fingering'}
      style={{ display: 'inline-block' }}
    >
      {/* Background */}
      <rect
        x="0" y="0"
        width={svgW} height={svgH}
        rx="3"
        fill="#f5ead0"
        stroke="#c8a96e"
        strokeWidth="0.5"
      />

      {/* Note label */}
      {noteName && (
        <text
          x={svgW / 2}
          y={cfg.padding}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={cfg.fontSize}
          fontWeight="600"
          fill="#5a3510"
          fontFamily="sans-serif"
        >
          {noteName}{noteOctave}
        </text>
      )}

      {/* 4 holes */}
      {HOLE_GRID.map((pos, i) => {
        let cx: number;
        let cy: number;

        if (useCustomLayout) {
          // Use custom layout positions scaled to SVG
          const hole = customLayout![i];
          cx = cfg.padding + hole.position.x * gridW;
          cy = cfg.padding + labelH + hole.position.y * gridH;
        } else {
          // Use 2x2 grid
          cx = cfg.padding + pos.col * (cfg.cellSize + cfg.gap) + cfg.cellSize / 2;
          cy = cfg.padding + labelH + pos.row * (cfg.cellSize + cfg.gap) + cfg.cellSize / 2;
        }

        const isCovered = holeStates[i] === true;

        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={cfg.holeR}
              fill={isCovered ? '#1a0e05' : '#c49040'}
              stroke="#7a4e20"
              strokeWidth="0.8"
            />
            {isCovered && (
              <circle
                cx={cx - cfg.holeR * 0.2}
                cy={cy - cfg.holeR * 0.2}
                r={cfg.holeR * 0.3}
                fill="rgba(80,40,10,0.4)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default TablatureSymbol;
