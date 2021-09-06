const colors: Record<string, string> = {
  "0": "#FECACA",
  "1": "#FDE68A",
  "2": "#A7F3D0",
  "3": "#BFDBFE",
  "4": "#C7D2FE",
  "5": "#DDD6FE",
  "6": "#FBCFE8",
  "7": "#F87171",
  "8": "#FBBF24",
  "9": "#34D399",
  "A": "#60A5FA",
  "B": "#818CF8",
  "C": "#A78BFA",
  "D": "#F472B6",
  "E": "#E5E7EB",
  "F": "#9CA3AF",
}

export default function Hexatar({ hex }: { hex: string }) {
  const dim = 3;

  const rows: string[][] = new Array(dim);
  for (let r = 0; r < dim; r++) {
    const start = r * dim;
    const cols = new Array(dim);
    for (let c = 0; c < dim; c++) {
      cols[c] = hex[start + c];
    }
    rows[r] = cols;
  }

  const lastChar = hex[hex.length - 1];
  const borderColor = colors[lastChar];

  return (
    <div>
      <div className="leading-none tracking-widest font-mono font-bold border-2 rounded-md p-1 w-12 flex flex-col justify-between text-xs select-none" style={{ borderColor }}>
        {rows.map((row, r) => {
          return (
            <div key={r} className="flex justify-evenly">
              {
                row.map((char, c) => {
                  const color = colors[char];
                  return <span key={c} style={{ color }}>{char}</span>;
                })
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}