import DB from "lib/db";
import { hostPrefix } from "lib/net";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Empty from "./empty";
import Hexatar from "./hexatar";
import HexString from "./hexString";

function SubscriptionItem({ profile }: { profile: any }) {
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

export default function SubscriptionList() {
  const [subs, setSubs] = useState<{ pubKey: string, handle?: string, host: string}[]>([]);
  useEffect(() => {
    // NOTE: must use filter because IndexedDB doesn't support indexing boolean fields.
    DB.profiles.filter((p: any) => p.following).toArray()
      .then((profiles: any[]) => setSubs(profiles));
  }, [])

  if (subs === undefined) {
    return null;
  }

  if (subs.length < 1) {
    return <Empty text="Not following anyone." subtext="Go to someone's profile and hit Follow. Then they'll appear here." />
  }

  return (
    <div className="space-y-2">
      {subs.map((profile: any) => <SubscriptionItem key={profile.pubKey} profile={profile} />)}
    </div>
  )
}