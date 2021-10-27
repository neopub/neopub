import SubscriberList from "components/subscriberList";
import SubscriptionList from "components/subscriptionList";
import SubReqs from "components/subscriptionRequests";
import { usePublicKeyHex } from "lib/auth";
import { useToken } from "lib/storage";

export default function Subs() {
  const { hex: pubKeyHex } = usePublicKeyHex();
  const { token } = useToken();
  
  if (!(pubKeyHex && token)) {
    return <div>Not identified. Can't access subscribers.</div>
  }

  return (
    <>
      <h1 className="mb-4">subscribers</h1>
      <SubscriberList />
      <h1 className="mb-4 mt-8">requests</h1>
      <SubReqs pubKeyHex={pubKeyHex} token={token} />
      <h1 className="mb-4 mt-8">subscriptions</h1>
      <SubscriptionList />
    </>
  );
}
