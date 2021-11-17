import { useSubscribers } from "lib/storage";
import { Link } from "react-router-dom";
import Empty from "./empty";
import Hexatar from "./hexatar";
import HexString from "./hexString";

function SubscriberItem({ pubKeyHex }: { pubKeyHex: string }) {
  return (
    <Link className="flex flex-row items-center space-x-2 no-underline" to={`/users/${pubKeyHex}`}>
      <Hexatar hex={pubKeyHex} />
      <HexString hex={pubKeyHex} />
    </Link>
  )
}

export default function SubscriberList() {
  const [subs] = useSubscribers();

  if (subs === undefined) {
    return null;
  }

  if (Object.values(subs).length < 1) {
    return <Empty text="No followers." />
  }

  return (
    <div>
      {subs.map(subPubKeyHex => <SubscriberItem key={subPubKeyHex} pubKeyHex={subPubKeyHex} />)}
    </div>
  )
}