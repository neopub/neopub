import { deleteFile, fetchInbox, fileLoc } from "lib/net";
import { useState, useEffect } from "react";
import { ID, loadID } from "./id";

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

export async function deleteInboxItem(id: string) {
  const ident = await loadID();
  if (!ident) {
    // TODO: show error. Real TODO: rearchitect so ident must be present before calling this.
    return;
  }

  // TODO: manage the prefixing with pubkeyhex all on the server side. Client doesn't need to care about that.
  const location = fileLoc(ident.pubKey.hex, `inbox/${id}`);
  try {
    deleteFile(ident.pubKey.hex, ident.token, location);
  } catch (err) {
    // TODO: handle in UI code.
    alert("Failed to delete.");
  }
}