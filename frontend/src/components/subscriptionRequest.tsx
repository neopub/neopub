import { ISubReq } from "core/types";
import { addSubscriber } from "lib/storage";
import { deleteInboxItem } from "models/inbox";
import HexIDCard from "./hexIdCard";

export default function Req({ id, req }: { id: string, req: ISubReq}) {
  function handleAccept() {
    addSubscriber(req);
  }

  function handleDelete() {
    deleteInboxItem(id);
  }

  return (
    <div className="flex flex-row items-center space-x-2">
      <HexIDCard {...req} />
      <div>{req.msg}</div>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  )
}
