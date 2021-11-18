import { fetchInbox } from "lib/net";
import { ID } from "./id";

export async function inboxCount(ident: ID): Promise<number> {
  const inbox = await fetchInbox(ident.pubKey.hex, ident.token);

  return inbox.length;
}