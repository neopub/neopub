import { fetchInbox } from "lib/net";
import { useState, useEffect } from "react";
import { ID } from "./id";

type Inbox = string[];

let inbox: Inbox | undefined;

async function loadInbox(ident: ID): Promise<Inbox | undefined> {
  const shouldRefetch = !inbox;
  if (shouldRefetch) {
    const newInbox = await fetchInbox(ident.pubKey.hex, ident.token);
    inbox = newInbox;
  }

  return inbox;
}

export function useInbox(ident?: ID | null): Inbox | undefined {
  const [inbox, setInbox] = useState<Inbox>();
  useEffect(() => {
    if (!ident) {
      return;
    }

    loadInbox(ident).then((inb) => {
      setInbox(inb);
    });
  }, [ident]);

  return inbox;
}

export async function inboxCount(ident: ID): Promise<number | undefined> {
  const inbox = await loadInbox(ident);

  if (inbox == null) {
    return;
  }

  return inbox.length;
}
