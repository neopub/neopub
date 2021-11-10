import { useState } from "react";

export default function KnowMore({ more }: { more: React.ReactElement }) {
  const [showMore, setShowMore] = useState(false);
  
  return (
    <div>
      <button className="border-0" disabled={showMore} onClick={() => setShowMore(true)}>Would you like to know more?</button>
      { showMore && more }
    </div>
  )
}