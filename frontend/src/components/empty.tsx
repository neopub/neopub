export default function Empty({ text, subtext }: { text: string, subtext?: string }) {
  return (
    <div className="flex justify-center my-8">
      <div className="max-w-sm">
        <h3 className="text-3xl font-bold">{text}</h3>
        {subtext && <div className="max-w-md text-lg">{subtext}</div>}
      </div>
    </div>
  );
}