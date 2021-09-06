export default function Timestamp({ ts }: { ts: string }) {
  const date = new Date(ts);

  return <div className="text-xs text-green-600">{date.toLocaleTimeString()}</div>;
}
