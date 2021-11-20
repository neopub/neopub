import { hostPrefix } from "lib/net";
import { useSubscribers } from "lib/storage";
import { Link } from "react-router-dom";
import Empty from "./empty";
import Hexatar from "./hexatar";
import HexString from "./hexString";

function SubscriberItem({ profile }: { profile: any }) {
  const { pubKey, handle, host } = profile;

  let link = `/users/${pubKey}`;
  if (host !== hostPrefix) {
    link += `?host=${escape(host)}`;
  }

  return (
    <Link className="flex flex-row items-center space-x-2 no-underline" to={link}>
      <Hexatar hex={pubKey} />
      <HexString hex={pubKey} />
      {handle}
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
      {subs.map((sub) => <SubscriberItem key={sub.pubKey} profile={sub} />)}
    </div>
  )
}