export default function Timestamp({ ts }: { ts: string }) {
  const date = new Date(ts);
  const now = new Date();

  const isToday = date.toLocaleDateString() === now.toLocaleDateString();
  const str = isToday ? date.toLocaleTimeString() : date.toLocaleString();

  return <div className="text-xs text-green-600">{str}</div>;
}
