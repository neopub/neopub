import SubReqs from "components/subscriptionRequests";
import { usePublicKeyHex } from "lib/auth";
import { useToken } from "lib/storage";

export default function Reqs() {
  const pubKeyHex = usePublicKeyHex();
  const token = useToken();
  
  if (!(pubKeyHex && token)) {
    return <div>Can't get reqs.</div>
  }

  return (
    <>
      <h1 className="mb-4">requests</h1>
      <SubReqs pubKeyHex={pubKeyHex} token={token} />
    </>
  );
}
