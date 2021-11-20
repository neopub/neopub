import { useSubscribers } from "lib/storage";
import Empty from "./empty";
import HexIDCard from "./hexIdCard";

function SubscriberItem({ profile }: { profile: any }) {
  const { pubKey, handle, host } = profile;
  return <HexIDCard {...{ pubKey, handle, host }} />;
}

export default function SubscriberList() {
  const [subs] = useSubscribers();

  if (subs === undefined) {
    return null;
  }

  if (Object.values(subs).length < 1) {
    return <Empty text="No followers." subtext="Share your QR code. When someone scans it and sends you a follow request, that will appear in your Inbox. When you accept the request, they'll appear here." />
  }

  return (
    <div>
      {subs.map((sub) => <SubscriberItem key={sub.pubKey} profile={sub} />)}
    </div>
  )
}