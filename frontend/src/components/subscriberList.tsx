import { useSubscribers } from "lib/storage";
import Hexatar from "./hexatar";
import HexString from "./hexString";

function SubscriberItem({ pubKeyHex }: { pubKeyHex: string }) {
  return (
    <div className="flex flex-row items-center space-x-2">
      <Hexatar hex={pubKeyHex} />
      <HexString hex={pubKeyHex} />
    </div>
  )
}

export default function SubscriberList() {
  const [subs] = useSubscribers();
  const pubKeys = Object.keys(subs ?? {})

  if (subs === undefined) {
    return null;
  }

  if (Object.values(subs).length < 1) {
    return <div>No subscribers.</div>
  }

  return (
    <div>
      {pubKeys.map(subPubKeyHex => <SubscriberItem key={subPubKeyHex} pubKeyHex={subPubKeyHex} />)}
    </div>
  )
}