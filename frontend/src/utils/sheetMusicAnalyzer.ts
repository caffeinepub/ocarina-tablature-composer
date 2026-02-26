// Browser-side sheet music image analysis using Canvas API heuristics

export interface DetectedNote {
  name: string;
  octave: number;
  timing: number; // duration in beats (1 = quarter, 2 = half, 4 = whole, 0.5 = eighth)
  confidence: number;
}

export interface AnalysisResult {
  notes: DetectedNote[];
  timeSignature: { numerator: number; denominator: number };
  overallConfidence: number;
  warnings: string[];
}

// Staff line detection: find horizontal lines in the image
function detectStaffLines(
  imageData: ImageData,
  width: number,
  height: number
): number[] {
  const data = imageData.data;
  const lineScores: number[] = new Array(height).fill(0);

  for (let y = 0; y < height; y++) {
    let darkPixels = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 100) darkPixels++;
    }
    lineScores[y] = darkPixels / width;
  }

  // Find rows with high dark pixel density (staff lines)
  const threshold = 0.3;
  const staffLines: number[] = [];
  let inLine = false;
  let lineStart = 0;

  for (let y = 0; y < height; y++) {
    if (lineScores[y] > threshold && !inLine) {
      inLine = true;
      lineStart = y;
    } else if (lineScores[y] <= threshold && inLine) {
      inLine = false;
      staffLines.push(Math.floor((lineStart + y) / 2));
    }
  }

  return staffLines;
}

// Detect note heads (dark oval blobs not on staff lines)
function detectNoteHeads(
  imageData: ImageData,
  width: number,
  height: number,
  staffLines: number[]
): Array<{ x: number; y: number; filled: boolean }> {
  const data = imageData.data;
  const noteHeads: Array<{ x: number; y: number; filled: boolean }> = [];
  const staffLineSet = new Set(staffLines.flatMap(l => [l - 1, l, l + 1]));

  // Scan for dark blobs not on staff lines
  const visited = new Set<number>();
  const minBlobSize = 8;
  const maxBlobSize = 200;

  for (let y = 5; y < height - 5; y++) {
    if (staffLineSet.has(y)) continue;
    for (let x = 5; x < width - 5; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const key = y * width + x;

      if (brightness < 80 && !visited.has(key)) {
        // BFS to find blob
        const blob: Array<{ x: number; y: number }> = [];
        const queue = [{ x, y }];
        visited.add(key);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          blob.push(curr);

          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const nkey = ny * width + nx;
            if (visited.has(nkey)) continue;
            const nidx = (ny * width + nx) * 4;
            const nbright = (data[nidx] + data[nidx + 1] + data[nidx + 2]) / 3;
            if (nbright < 100) {
              visited.add(nkey);
              queue.push({ x: nx, y: ny });
            }
          }
        }

        if (blob.length >= minBlobSize && blob.length <= maxBlobSize) {
          const cx = Math.round(blob.reduce((s, p) => s + p.x, 0) / blob.length);
          const cy = Math.round(blob.reduce((s, p) => s + p.y, 0) / blob.length);
          // Check if blob is roughly oval (note head shape)
          const xs = blob.map(p => p.x);
          const ys = blob.map(p => p.y);
          const blobWidth = Math.max(...xs) - Math.min(...xs);
          const blobHeight = Math.max(...ys) - Math.min(...ys);
          const aspectRatio = blobWidth / (blobHeight || 1);

          if (aspectRatio > 0.5 && aspectRatio < 3.0 && blobHeight > 3) {
            noteHeads.push({ x: cx, y: cy, filled: blob.length > 30 });
          }
        }
      }
    }
  }

  return noteHeads;
}

// Map vertical position to note name based on staff lines
function positionToNote(
  y: number,
  staffLines: number[]
): { name: string; octave: number } {
  if (staffLines.length < 5) {
    // Fallback: use relative position
    return { name: 'C', octave: 4 };
  }

  // Standard treble clef: lines from bottom = E4, G4, B4, D5, F5
  // Spaces from bottom = F4, A4, C5, E5
  const sortedLines = [...staffLines].sort((a, b) => a - b);
  const lineSpacing = (sortedLines[sortedLines.length - 1] - sortedLines[0]) / 4;

  // Notes from top to bottom in treble clef
  const trebleNotes = [
    { name: 'G', octave: 5 }, // above top line
    { name: 'F', octave: 5 }, // top line
    { name: 'E', octave: 5 }, // space
    { name: 'D', octave: 5 }, // 4th line
    { name: 'C', octave: 5 }, // space
    { name: 'B', octave: 4 }, // 3rd line (middle)
    { name: 'A', octave: 4 }, // space
    { name: 'G', octave: 4 }, // 2nd line
    { name: 'F', octave: 4 }, // space
    { name: 'E', octave: 4 }, // 1st line (bottom)
    { name: 'D', octave: 4 }, // below bottom
    { name: 'C', octave: 4 }, // ledger line below
  ];

  const topLine = sortedLines[0];
  const halfStep = lineSpacing / 2;
  const noteIndex = Math.round((y - topLine) / halfStep);
  const clampedIndex = Math.max(0, Math.min(noteIndex, trebleNotes.length - 1));

  return trebleNotes[clampedIndex];
}

export async function analyzeSheetMusic(file: File): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const warnings: string[] = [];

        // Detect staff lines
        const staffLines = detectStaffLines(imageData, canvas.width, canvas.height);

        if (staffLines.length < 5) {
          warnings.push('Could not clearly detect staff lines. Results may be inaccurate.');
        }

        // Detect note heads
        const noteHeads = detectNoteHeads(imageData, canvas.width, canvas.height, staffLines);

        if (noteHeads.length === 0) {
          warnings.push('No note heads detected. Please ensure the image is clear and high contrast.');
          resolve({
            notes: [],
            timeSignature: { numerator: 4, denominator: 4 },
            overallConfidence: 0,
            warnings,
          });
          return;
        }

        // Sort note heads left to right
        const sortedHeads = [...noteHeads].sort((a, b) => a.x - b.x);

        // Convert to notes
        const notes: DetectedNote[] = sortedHeads.map((head) => {
          const noteInfo = positionToNote(head.y, staffLines);
          return {
            name: noteInfo.name,
            octave: noteInfo.octave,
            timing: head.filled ? 1 : 2, // filled = quarter, open = half
            confidence: staffLines.length >= 5 ? 0.65 : 0.35,
          };
        });

        const overallConfidence = notes.length > 0
          ? notes.reduce((s, n) => s + n.confidence, 0) / notes.length
          : 0;

        if (notes.length > 0 && overallConfidence < 0.5) {
          warnings.push('Low confidence detection. Please review and edit the detected notes.');
        }

        resolve({
          notes,
          timeSignature: { numerator: 4, denominator: 4 },
          overallConfidence,
          warnings,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
