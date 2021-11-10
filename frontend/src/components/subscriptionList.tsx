import DB from "lib/db";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Empty from "./empty";
import Hexatar from "./hexatar";
import HexString from "./hexString";

function SubscriptionItem({ pubKeyHex }: { pubKeyHex: string }) {
  return (
    <Link className="flex flex-row items-center space-x-2 no-underline" to={`/users/${pubKeyHex}`}>
      <Hexatar hex={pubKeyHex} />
      <HexString hex={pubKeyHex} />
    </Link>
  )
}

export default function SubscriptionList() {
  const [subs, setSubs] = useState<{ pubKey: string}[]>([]);
  useEffect(() => {
    DB.subscriptions.toArray().then((rows: any) => setSubs(rows));
  }, [])

  if (subs === undefined) {
    return null;
  }

  if (subs.length < 1) {
    return <Empty text="Not following anyone." />
  }

  return (
    <div>
      {subs.map(({ pubKey }) => <SubscriptionItem key={pubKey} pubKeyHex={pubKey} />)}
    </div>
  )
}