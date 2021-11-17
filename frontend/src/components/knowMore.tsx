import { useState } from "react";

export default function KnowMore({ more, label }: { more: React.ReactElement, label?: string }) {
  const [showMore, setShowMore] = useState(false);
  
  return (
    <div>
      <button className="border-0" disabled={showMore} onClick={() => setShowMore(true)}>{label ?? "Would you like to know more?"}</button>
      { showMore && more }
    </div>
  )
}