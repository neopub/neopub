import { ISubReq } from "core/types";
import { addSubscriber } from "lib/storage";
import HexIDCard from "./hexIdCard";

export default function Req({ req }: { req: ISubReq}) {
  function handleAccept() {
    addSubscriber(req);
  }

  return (
    <div className="flex flex-row items-center space-x-2">
      <HexIDCard {...req} />
      <div>{req.msg}</div>
      <button onClick={handleAccept}>Accept</button>
    </div>
  )
}
