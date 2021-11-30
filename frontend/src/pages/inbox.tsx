import Empty from "components/empty";
import { IdentityContext } from "models/id";
import { InboxContext } from "models/inbox";
import { useContext } from "react";
import InboxItem from "../components/inboxItem";

export default function Inbox() {
  const ident = useContext(IdentityContext);
  const inbox = useContext(InboxContext);

  return (
    <main>
      <h1 className="mb-8">inbox</h1>
      {
        ident && inbox && (
          <div className="space-y-3">
            { inbox.map(i => <InboxItem key={i} id={i} pubKeyHex={ident.pubKey.hex} />) }
          </div>
        )
      }
      {
        inbox && inbox.length < 1 && <Empty text="No inbox items." subtext="Follow requests, and replies to your posts, will appear here." />
      }
    </main>
  )
}