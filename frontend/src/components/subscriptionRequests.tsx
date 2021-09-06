import { fetchReqs } from "lib/net";
import { useEffect, useState } from "react";
import SubReq from "components/subscriptionRequest";

export default function SubReqs({
  pubKeyHex,
  token,
}: {
  pubKeyHex: string;
  token: string;
}) {
  const [reqNames, setReqNames] = useState<string[]>([]);
  useEffect(() => {
    fetchReqs(pubKeyHex, token).then((reqs) => {
      setReqNames(reqs);
    });
  }, [pubKeyHex, token]);

  if (reqNames.length < 1) {
    return <div>No subscription requests.</div>
  }

  return (
    <div>
      {reqNames.map((r) => (
        <SubReq key={r} pubKeyHex={pubKeyHex} reqName={r} />
      ))}
    </div>
  );
}
