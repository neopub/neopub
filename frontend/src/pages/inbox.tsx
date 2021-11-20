import Empty from "components/empty";
import { useID } from "models/id";
import { useInbox } from "models/inbox";
import InboxItem from "../components/inboxItem";

export default function Inbox() {
  const id = useID();
  const inbox = useInbox(id);

  return (
    <main>
      <h1 className="mb-8">inbox</h1>
      {
        id && inbox && (
          <div className="space-y-3">
            { inbox.map(i => <InboxItem key={i} id={i} pubKeyHex={id.pubKey.hex} />) }
          </div>
        )
      }
      {
        inbox && inbox.length < 1 && <Empty text="No inbox items." subtext="Follow requests, and replies to your posts, will appear here." />
      }
    </main>
  )
}