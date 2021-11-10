import { usePublicKeyHex } from "lib/auth";
import { fetchInbox } from "lib/net";
import { useToken } from "lib/storage";
import { useState, useEffect } from "react";
import InboxItem from "./components/inboxItem";

export default function Inbox() {
  const { hex: pubKeyHex } = usePublicKeyHex();
  const { token } = useToken();

  const [inbox, setInbox] = useState<string[]>([]);
  useEffect(() => {
    if (!pubKeyHex || !token) {
      return;
    }

    fetchInbox(pubKeyHex, token).then((inb: string[]) => {
      setInbox(inb);
    });
  }, [pubKeyHex, token]);

  return (
    <main>
      <h1 className="mb-8">inbox</h1>
      {
        pubKeyHex && inbox.map(id => <InboxItem key={id} id={id} pubKeyHex={pubKeyHex} />)
      }
    </main>
  )
}