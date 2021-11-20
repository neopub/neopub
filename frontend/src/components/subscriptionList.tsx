import DB from "lib/db";
import { useEffect } from "react";
import { useState } from "react";
import Empty from "./empty";
import HexIDCard from "./hexIdCard";

function SubscriptionItem({ profile }: { profile: any }) {
  const { pubKey, handle, host } = profile;
  return <HexIDCard {...{ pubKey, handle, host }} />;
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