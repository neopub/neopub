import HexString from "components/hexString";
import { ISubReq } from "core/types";
import { addSubscriberPubKey } from "lib/storage";
import Hexatar from "./hexatar";

export default function Req({ req }: { req: ISubReq}) {
  function handleAccept() {
    addSubscriberPubKey(req.pubKey);
  }

  return (
    <div className="flex flex-row items-center space-x-2">
      <Hexatar hex={req.pubKey} />
      <HexString hex={req.pubKey} />
      <div>{req.msg}</div>
      <button onClick={handleAccept}>Accept</button>
    </div>
  )
}
