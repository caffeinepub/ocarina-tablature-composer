import React from 'react';
import TablatureSymbol from './TablatureSymbol';
import type { HoleLayout } from '../backend';

interface StaffNotationProps {
  noteName: string;
  octave: number;
  pattern?: boolean[];
  customLayout?: HoleLayout[] | null;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

// Staff positions for treble clef notes (line/space index from bottom)
// 0 = first ledger line below (C4), 1 = first space (D4), etc.
const NOTE_STAFF_POSITIONS: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

export const StaffNotation: React.FC<StaffNotationProps> = ({
  noteName,
  octave,
  pattern,
  customLayout,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const staffWidth = 44;
  const staffHeight = 60;
  const lineSpacing = 7;
  const staffTop = 8;

  // Calculate note position on staff
  const basePos = NOTE_STAFF_POSITIONS[noteName] ?? 0;
  const octaveOffset = (octave - 4) * 7;
  const totalPos = basePos + octaveOffset;

  const noteY = staffTop + (10 - totalPos) * (lineSpacing / 2);

  const needsLedgerBelow = totalPos < 2;
  const needsLedgerAbove = totalPos > 10;

  const stemUp = totalPos < 6;
  const stemX = stemUp ? staffWidth * 0.62 : staffWidth * 0.38;
  const stemEndY = stemUp ? noteY - 22 : noteY + 22;

  return (
    <div
      className={`flex flex-col items-center cursor-pointer select-none ${className}`}
      onClick={onClick}
    >
      {/* Staff + Note */}
      <svg
        width={staffWidth}
        height={staffHeight}
        viewBox={`0 0 ${staffWidth} ${staffHeight}`}
        style={{ display: 'block' }}
      >
        {/* Staff lines (5 lines) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={4}
            y1={staffTop + i * lineSpacing}
            x2={staffWidth - 4}
            y2={staffTop + i * lineSpacing}
            stroke={isSelected ? '#8b4513' : '#3a2510'}
            strokeWidth="0.8"
          />
        ))}

        {/* Ledger line below if needed (C4) */}
        {needsLedgerBelow && (
          <line
            x1={staffWidth * 0.3}
            y1={noteY}
            x2={staffWidth * 0.7}
            y2={noteY}
            stroke="#3a2510"
            strokeWidth="0.8"
          />
        )}

        {/* Ledger line above if needed */}
        {needsLedgerAbove && (
          <line
            x1={staffWidth * 0.3}
            y1={noteY}
            x2={staffWidth * 0.7}
            y2={noteY}
            stroke="#3a2510"
            strokeWidth="0.8"
          />
        )}

        {/* Stem */}
        <line
          x1={stemX}
          y1={noteY}
          x2={stemX}
          y2={stemEndY}
          stroke={isSelected ? '#8b4513' : '#1a0e05'}
          strokeWidth="1.2"
        />

        {/* Note head */}
        <ellipse
          cx={staffWidth * 0.5}
          cy={noteY}
          rx={5.5}
          ry={4}
          fill={isSelected ? '#8b4513' : '#1a0e05'}
          transform={`rotate(-15, ${staffWidth * 0.5}, ${noteY})`}
        />

        {/* Selection highlight */}
        {isSelected && (
          <rect
            x={2}
            y={staffTop - 4}
            width={staffWidth - 4}
            height={staffHeight - staffTop + 4}
            fill="rgba(139,69,19,0.1)"
            rx="2"
          />
        )}
      </svg>

      {/* Note name label */}
      <div className="text-[9px] font-ui text-ink-light mt-0.5">
        {noteName}{octave}
      </div>

      {/* Tablature symbol — use 'sm' size */}
      <TablatureSymbol
        noteName={noteName}
        pattern={pattern}
        customLayout={customLayout}
        size="sm"
        className="mt-1"
      />
    </div>
  );
};

export default StaffNotation;
