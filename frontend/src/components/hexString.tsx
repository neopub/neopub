import { ReactElement } from "react";

export default function HexString({ hex }: { hex: string | ReactElement }) {
  return (
    <div
      className="text-sm"
      style={{
        maxWidth: "16em",
        height: "42px",
        fontFamily: "monospace",
        wordBreak: "break-all",
        lineHeight: "8px",
      }}
    >
      {hex}
    </div>
  );
}
