export default function Empty({ text, subtext }: { text: string, subtext?: string }) {
  return (
    <div>
      <h3 className="text-3xl">{text}</h3>
      {subtext && <div className="max-w-md text-lg">{subtext}</div>}
    </div>
  );
}