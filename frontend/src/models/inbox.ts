import { ISubReq } from "core/types";
import EventBus from "lib/eventBus";
import Net from "lib/net";
import { useState, useEffect, createContext } from "react";
import { ID, loadID } from "./id";
import { addSubscriber } from "./profile";

type Inbox = string[];

let inbox: Inbox | undefined;

const inboxChange = new EventBus();

async function loadInbox(ident: ID, force?: boolean): Promise<Inbox | undefined> {
  const shouldRefetch = force || !inbox;
  if (shouldRefetch) {
    const newInbox = await Net.fetchInbox(ident.pubKey.hex, ident.token);
    inbox = newInbox;
  }

  return inbox;
}

export const InboxContext = createContext<Inbox | undefined>(undefined);

export function useInbox(ident?: ID | null): Inbox | undefined {
  const [inbox, setInbox] = useState<Inbox>();
  useEffect(() => {
    async function reloadInbox() {
      if (!ident) {
        return;
      }

      const inb = await loadInbox(ident, true);
      setInbox(inb);
    }
    
    reloadInbox();

    inboxChange.on(reloadInbox);
    return () => {
      inboxChange.off(reloadInbox);
    }
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
  const location = Net.fileLoc(ident.pubKey.hex, `inbox/${id}`);
  try {
    Net.deleteFile(ident.pubKey.hex, ident.token, location);
    inboxChange.emit();
  } catch (err) {
    // TODO: handle in UI code.
    alert("Failed to delete.");
  }
}

export async function acceptRequest(id: string, req: ISubReq) {
  await addSubscriber(req);
  return deleteInboxItem(id);
}
