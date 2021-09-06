import { usePrivateKey } from "lib/auth";
import { useEffect, useState } from "react";
import HexString from "components/hexString";
import { IReq } from "core/types";
import { unwrapReq } from "lib/api";
import { addSubscriberPubKey, useSubscribers } from "lib/storage";
import Hexatar from "./hexatar";

export default function SubReq({
  pubKeyHex,
  reqName,
}: {
  pubKeyHex: string;
  reqName: string;
}) {
  const privKey = usePrivateKey("ECDH");

  const [req, setReq] = useState<IReq>();
  useEffect(() => {
    if (!privKey) {
      return;
    }
    unwrapReq(reqName, pubKeyHex, privKey).then((req) => setReq(req));
  }, [reqName, privKey, pubKeyHex]);

  const [subs, refetchSubs] = useSubscribers();

  function handleAccept() {
    if (!req?.pubKey) {
      console.error("no req pubkey");
      return;
    }
    addSubscriberPubKey(req.pubKey);
    refetchSubs();
  }

  if (subs && req && subs[req.pubKey]) {
    return null;
  }

  if (!req) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-row items-center space-x-2">
      <Hexatar hex={req.pubKey} />
      <HexString hex={req.pubKey} />
      <div>{req.msg}</div>
      <button onClick={handleAccept}>Accept</button>
    </div>
  );
}
