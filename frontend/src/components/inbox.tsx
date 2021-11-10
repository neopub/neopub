import { fetchInbox } from "lib/net";
import { useState, useEffect } from "react";
import InboxItem from "./inboxItem";

export default function Inbox({ pubKeyHex, token }: { pubKeyHex: string, token: string }) {
  const [inbox, setInbox] = useState<string[]>([]);
  useEffect(() => {
    fetchInbox(pubKeyHex, token).then((inb: string[]) => {
      setInbox(inb);
    });
  }, [pubKeyHex, token]);

  return (
    <div>
      <h2 className="mb-3">Inbox</h2>
      {
        inbox.map(id => <InboxItem key={id} id={id} pubKeyHex={pubKeyHex} />)
      }
    </div>
  )
}