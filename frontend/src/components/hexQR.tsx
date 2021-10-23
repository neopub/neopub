import QRCode from "react-qr-code";

export default function HexQR({ hex }: { hex: string }) {
  const QR = QRCode as any;

  const bgColor = "#141623";
  const fgColor = "#2BAA18";

  return (
    <div className="border-2 rounded-md p-1 select-none" style={{ borderColor: fgColor }}>
      <QR value={hex} fgColor={fgColor} bgColor={bgColor} size={128} level="L" />
    </div>
  );
}