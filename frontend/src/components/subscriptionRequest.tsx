import { ISubReq } from "core/types";
import { acceptRequest, deleteInboxItem } from "models/inbox";
import HexIDCard from "./hexIdCard";

export default function Req({ id, req }: { id: string, req: ISubReq}) {
  async function handleAccept() {
    await acceptRequest(id, req);
  }

  function handleDelete() {
    deleteInboxItem(id);
  }

  return (
    <div>
      <div className="flex flex-row items-center space-x-2">
        <HexIDCard {...req} />
        <div>{req.msg}</div>
      </div>
      <div className="flex flex-row space-x-2 w-72 mt-2 mb-8 ml-12">
        <button onClick={handleAccept} className="flex-1">Accept</button>
        <button onClick={handleDelete} className="flex-1 border-none">Delete</button>
      </div>
    </div>
  )
}
