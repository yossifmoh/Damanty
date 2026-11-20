import React, { useMemo } from 'react';

/**
 * Deterministic SVG QR code generator with standard 3-corner finder patterns.
 * Produces a crisp, high-contrast QR visual for any seed string with zero external dependencies.
 */
export default function QrCodeSvg({ value = 'DAMANTY-CERT', size = 140, className = '' }) {
  const sizeGrid = 21;

  const matrix = useMemo(() => {
    const grid = Array.from({ length: sizeGrid }, () => Array(sizeGrid).fill(false));

    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, sizeGrid - 7);
    drawFinder(sizeGrid - 7, 0);

    // Timing patterns
    for (let i = 8; i < sizeGrid - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Seeded pseudo-random fill for data modules
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < sizeGrid; r++) {
      for (let c = 0; c < sizeGrid; c++) {
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= sizeGrid - 8;
        const inBottomLeft = r >= sizeGrid - 8 && c < 8;
        const onTiming = r === 6 || c === 6;
        if (inTopLeft || inTopRight || inBottomLeft || onTiming) continue;

        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        grid[r][c] = (hash >>> 24) % 2 === 0;
      }
    }

    return grid;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${sizeGrid} ${sizeGrid}`}
      className={`rounded-lg bg-white p-1.5 ${className}`}
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <rect width={sizeGrid} height={sizeGrid} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={0.95}
              height={0.95}
              rx={0.12}
              fill="#060913"
            />
          ) : null
        )
      )}
    </svg>
  );
}
