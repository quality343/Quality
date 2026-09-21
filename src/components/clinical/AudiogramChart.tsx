/**
 * Audiogram chart — renders RECORDED thresholds only. Pure display component:
 * no interpretation, scoring, or diagnosis.
 */

const FREQS = [250, 500, 1000, 2000, 4000, 8000] as const;
const DB_MIN = -10;
const DB_MAX = 120;

type EarThresholds = Partial<Record<"f250" | "f500" | "f1000" | "f2000" | "f4000" | "f8000", number>>;

export type AudiogramData = {
  air: { right: EarThresholds; left: EarThresholds };
  bone?: { right: EarThresholds; left: EarThresholds };
};

const W = 640;
const H = 320;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 24;
const PAD_B = 40;

const x = (freqIdx: number) =>
  PAD_L + (freqIdx / (FREQS.length - 1)) * (W - PAD_L - PAD_R);
const y = (db: number) =>
  PAD_T + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * (H - PAD_T - PAD_B);

function freqKey(f: number): keyof EarThresholds {
  return `f${f}` as keyof EarThresholds;
}

function earPath(ear: EarThresholds): string {
  const pts = FREQS.map((f, i) => {
    const v = ear[freqKey(f)];
    return v === undefined ? null : { px: x(i), py: y(v) };
  }).filter((p): p is { px: number; py: number } => p !== null);
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(" ");
}

function earPoints(ear: EarThresholds) {
  const pts: { px: number; py: number; db: number; freq: number }[] = [];
  FREQS.forEach((f, i) => {
    const v = ear[freqKey(f)];
    if (v !== undefined) pts.push({ px: x(i), py: y(v), db: v, freq: f });
  });
  return pts;
}

export function AudiogramChart({ data }: { data: AudiogramData }) {
  const dbTicks: number[] = [];
  for (let db = DB_MIN; db <= DB_MAX; db += 10) dbTicks.push(db);

  return (
    <figure aria-label="Audiogram chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-2xl"
        role="img"
        aria-label="Pure tone audiogram, right ear red, left ear blue"
      >
        {/* Grid */}
        {dbTicks.map((db) => (
          <g key={db}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(db)} y2={y(db)} stroke="#e5e7eb" strokeWidth={db % 20 === 0 ? 1 : 0.5} />
            {db % 20 === 0 ? (
              <text x={PAD_L - 8} y={y(db) + 3} textAnchor="end" fontSize={10} fill="#6b7280">
                {db}
              </text>
            ) : null}
          </g>
        ))}
        {FREQS.map((f, i) => (
          <g key={f}>
            <line x1={x(i)} x2={x(i)} y1={PAD_T} y2={H - PAD_B} stroke="#e5e7eb" strokeWidth={0.5} />
            <text x={x(i)} y={H - PAD_B + 14} textAnchor="middle" fontSize={10} fill="#6b7280">
              {f >= 1000 ? `${f / 1000}k` : f}
            </text>
          </g>
        ))}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="#374151">
          Frequency (Hz)
        </text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize={11} fill="#374151" transform={`rotate(-90 12 ${H / 2})`}>
          dB HL
        </text>

        {/* Air conduction lines */}
        <path d={earPath(data.air.right)} fill="none" stroke="#d01028" strokeWidth={2} />
        <path d={earPath(data.air.left)} fill="none" stroke="#004898" strokeWidth={2} strokeDasharray="1 0" />

        {/* Right ear: circles; Left ear: crosses */}
        {earPoints(data.air.right).map((p) => (
          <circle key={`r-${p.freq}`} cx={p.px} cy={p.py} r={5} fill="white" stroke="#d01028" strokeWidth={2} />
        ))}
        {earPoints(data.air.left).map((p) => (
          <g key={`l-${p.freq}`} stroke="#004898" strokeWidth={2}>
            <line x1={p.px - 5} y1={p.py - 5} x2={p.px + 5} y2={p.py + 5} />
            <line x1={p.px - 5} y1={p.py + 5} x2={p.px + 5} y2={p.py - 5} />
          </g>
        ))}

        {/* Bone conduction (dashed markers) */}
        {data.bone
          ? earPoints(data.bone.right).map((p) => (
              <rect key={`br-${p.freq}`} x={p.px - 4} y={p.py - 4} width={8} height={8} fill="none" stroke="#d01028" strokeWidth={1.5} strokeDasharray="2 1" />
            ))
          : null}
        {data.bone
          ? earPoints(data.bone.left).map((p) => (
              <rect key={`bl-${p.freq}`} x={p.px - 4} y={p.py - 4} width={8} height={8} fill="none" stroke="#004898" strokeWidth={1.5} strokeDasharray="2 1" />
            ))
          : null}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#d01028]" /> Right — air
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border-2 border-[#004898]" /> Left — air
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 border border-dashed border-[#6b7280]" /> Bone (dashed square)
        </span>
      </figcaption>
    </figure>
  );
}
