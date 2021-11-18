import Empty from "components/empty";
import { fetchInbox } from "lib/net";
import { useID } from "models/id";
import { useState, useEffect } from "react";
import InboxItem from "../components/inboxItem";

export default function Inbox() {
  const id = useID();

  const [inbox, setInbox] = useState<string[]>([]);
  useEffect(() => {
    if (!id) {
      return;
    }

    fetchInbox(id.pubKey.hex, id.token).then((inb: string[]) => {
      setInbox(inb);
    });
  }, [id]);

  return (
    <main>
      <h1 className="mb-8">inbox</h1>
      {
        id && inbox.map(i => <InboxItem key={i} id={i} pubKeyHex={id.pubKey.hex} />)
      }
      {
        inbox.length < 1 && <Empty text="No inbox items. Follow requests, and replies to your posts, will appear here." />
      }
    </main>
  )
}