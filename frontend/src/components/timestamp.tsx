export default function Timestamp({ ts }: { ts: string }) {
  const date = new Date(ts);
  const now = new Date();

  const isToday = date.toLocaleDateString() === now.toLocaleDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  const dateOpts = {
    year: isThisYear ? undefined : "numeric",
    month: "short",
    day: "numeric",
  } as const;

  const timeOpts = {
    hour: "numeric",
    minute: "numeric",
    second: undefined,
  } as const;

  const fmt = new Intl.DateTimeFormat([], isToday ? timeOpts : dateOpts)

  const str = fmt.format(date);

  return <div className="text-xs text-green-600">{str}</div>;
}
