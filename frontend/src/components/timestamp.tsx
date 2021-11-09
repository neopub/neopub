export default function Timestamp({ ts }: { ts: string }) {
  const date = new Date(ts);
  const now = new Date();

  const str = date.toLocaleDateString() !== now.toLocaleDateString() ? date.toLocaleString() : date.toLocaleTimeString();

  return <div className="text-xs text-green-600">{str}</div>;
}
