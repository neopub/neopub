import { hostPrefix } from "lib/net";
import { IdentityContext } from "models/id";
import { useReplies } from "models/reply";
import { useContext } from "react";
import Empty from "./empty";
import PostList from "./postList";

export default function RepliesList() {
  const ident = useContext(IdentityContext);
  const replies = useReplies(ident);

  if (!ident || !replies) {
    return null;
  }

  const empty = <Empty text="No replies" subtext="Write a reply and it will show up here."/>;

  return <PostList pubKeyHex={ident.pubKey.hex} id={ident.pubKey.hex} worldKeyHex={ident.worldKey.hex} posts={replies} host={hostPrefix} empty={empty} />;
}
