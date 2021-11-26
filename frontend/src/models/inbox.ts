import { ISubReq } from "core/types";
import EventBus from "lib/eventBus";
import { deleteFile, fetchInbox, fileLoc } from "lib/net";
import { useState, useEffect } from "react";
import { ID, loadID } from "./id";
import { addSubscriber } from "./profile";

type Inbox = string[];

let inbox: Inbox | undefined;

const inboxChange = new EventBus();

async function loadInbox(ident: ID, force?: boolean): Promise<Inbox | undefined> {
  const shouldRefetch = force || !inbox;
  if (shouldRefetch) {
    const newInbox = await fetchInbox(ident.pubKey.hex, ident.token);
    inbox = newInbox;
  }

  return inbox;
}

export function useInbox(ident?: ID | null): Inbox | undefined {
  const [inbox, setInbox] = useState<Inbox>();
  useEffect(() => {
    async function reloadInbox(force: boolean) {
      if (!ident) {
        return;
      }

      const inb = await loadInbox(ident, force);
      setInbox(inb);
    }

    // TODO: fix double reload caused by menu bar and inbox page reacting to same event (rearchitect state).
    function forceReloadInbox() {
      reloadInbox(true);
    }
    
    reloadInbox(false);

    inboxChange.on(forceReloadInbox);
    return () => {
      inboxChange.off(forceReloadInbox);
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
  const location = fileLoc(ident.pubKey.hex, `inbox/${id}`);
  try {
    deleteFile(ident.pubKey.hex, ident.token, location);
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
