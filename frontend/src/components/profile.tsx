 import type { IProfile, IIndex } from "core/types";
import { useJSON } from "lib/useJSON";
import { usePublicKeyHex } from "lib/auth";
import Hexatar from "./hexatar";
import { Link, useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import DB from "lib/db";
import { fileLoc, getFileJSON, hostPrefix } from "lib/net";
import HexQR from "./hexQR";
import { useToken } from "lib/storage";
import PostList from "./postList";
import SubscriberList from "./subscriberList";
import SubscribeView from "./subscribeView";
import SubscriptionList from "./subscriptionList";

interface IProps {
  id: string;
}
export default function Profile({ id }: IProps) {
  const history = useHistory();
  
  const { hex: pubKeyHex } = usePublicKeyHex();
  const isAuthedUser = pubKeyHex && id === pubKeyHex;

  const { token } = useToken();

  const [profile] = useJSON<IProfile>(id, "profile.json", { handle: "", avatarURL: "", worldKey: "" });

  const [index, setIndex] = useState<IIndex | "notfound">({ posts: [], updatedAt: "" });
  useEffect(() => {
    // TODO: manage potential local/remote index conflicts.
    async function load() {
      let updatedAt = "";

      // Must put an updatedAt timestamp on index, to know which should win.
      const row = await DB.indexes.get(id);
      if (row) {
        setIndex(row.index);
        updatedAt = row.updatedAt;
      }

      const location = fileLoc(id, "index.json");
      const remoteIndex = await getFileJSON<IIndex>(location);
      if (remoteIndex && remoteIndex !== "notfound" && remoteIndex.updatedAt > updatedAt) {
        setIndex(remoteIndex);
      }
    }

    if (!id) {
      return;
    }

    load();
  }, [id]);

  // const [index] = useJSON<IIndex>(id, "index.json", { posts: [] });

  const [isSubscribed, setIsSubscribed] = useState(false);
  useEffect(() => {
    if (!id) {
      return;
    }

    DB.subscriptions.get(id).then((sub: any) => {
      setIsSubscribed(sub != null);
    });
  }, [id])

  if (profile === "notfound") {
    return <div>Not found.</div>
  }

  const worldKeyHex = profile?.worldKey;

  const host = escape(hostPrefix);

  return (
    <main>
      <h1 className="mb-8">profile</h1>

      <div className="flex mb-8">
        <a href={`/users/${id}?host=${host}`}><HexQR hex={`https://${document.location.host}/users/${id}?host=${host}`} /></a>
      </div>

      <div className="flex flex-row space-x-1 mb-4">
        <Hexatar hex={id} />
        {isAuthedUser && <Link to="/creds/dump">Creds</Link>}
        {!isAuthedUser && (isSubscribed ? <Link to={`/subs`}>Subscribed</Link> : <Link to={`/users/${id}/sub`}>Subscribe</Link>)}
      </div>

      <div>
        <h2 className="mb-3">Posts</h2>
        {isAuthedUser && <button onClick={() => history.push("/post")} className="button">New Post</button>}
        {index === "notfound" || !index ? <div>No posts</div> : <PostList pubKeyHex={pubKeyHex} id={id} worldKeyHex={worldKeyHex} index={index} host={unescape(host)} />}
      </div>

      {isAuthedUser && pubKeyHex && token && (
        <>
          <h2 className="mb-4">Followers</h2>
          <SubscriberList />
        </>
      )}

      {isAuthedUser && pubKeyHex && token && (
        <>
          <h2 className="mb-4 mt-8">Following</h2>
          <SubscriptionList />
          <SubscribeView pubKeyHex={pubKeyHex} />
        </>
      )}
    </main>
  );
}
