 import type { IProfile, IIndex, IEncPost } from "core/types";
import { useJSON } from "lib/useJSON";
import { usePrivateKey, usePublicKeyHex } from "lib/auth";
import Hexatar from "./hexatar";
import { Link, useHistory } from "react-router-dom";
import EncryptedPost from "./encryptedPost";
import { useEffect, useState } from "react";
import DB from "lib/db";
import { fetchInbox, fileLoc, getFileJSON, hostPrefix } from "lib/net";
import HexQR from "./hexQR";
import { sendReply, unwrapInboxItem } from "lib/api";
import { useToken } from "lib/storage";

// TODO: extract.
function InboxItem({ id, pubKeyHex }: { id: string, pubKeyHex: string }) {
  const privKey = usePrivateKey("ECDH");

  // TODO: do all this unwrapping in a data layer. Not UI.
  const [item, setItem] = useState<any>();
  useEffect(() => {
    if (!privKey) {
      return;
    }
    unwrapInboxItem(id, pubKeyHex, privKey)
      .then((item) => setItem(item))
      .catch(err => { console.log(err) });
  }, [id, privKey, pubKeyHex]);

  return <div>{JSON.stringify(item)}</div>
}

function Inbox({ pubKeyHex, token }: { pubKeyHex: string, token: string }) {
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

function PostList({ pubKeyHex, index, id, worldKeyHex, host }: { index: IIndex, id: string, worldKeyHex?: string, pubKeyHex?: string, host: string }) {
  if (index.posts?.length === 0) {
    return <div className="mt-2">No posts.</div>;
  }

  function handleReply(postId: string, pubKey: string) {
    if (!pubKeyHex) {
      return;
    }

    const reply = prompt("Reply");
    if (!reply) {
      return;
    }

    sendReply(postId, id, pubKeyHex, reply, host);
  }

  const showReply = id !== pubKeyHex;

  return (
    <>
      {
        index.posts?.map(
          (p, i) =>
            id && (
              <div key={i} className="flex flex-row items-start space-x-8">
                <EncryptedPost
                  key={i}
                  enc={p as IEncPost}
                  pubKey={id}
                  worldKeyHex={worldKeyHex}
                />
                {showReply && <button onClick={() => handleReply((p as IEncPost).id, id)}>Reply</button>}
              </div>
            ),
        )
      }
    </>
  );
}
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

      {isAuthedUser && pubKeyHex && token && <Inbox pubKeyHex={pubKeyHex} token={token} />}

      <div>
        <h2 className="mb-3">Posts</h2>
        {isAuthedUser && <button onClick={() => history.push("/post")} className="button">New Post</button>}
        {index === "notfound" || !index ? <div>No posts</div> : <PostList pubKeyHex={pubKeyHex} id={id} worldKeyHex={worldKeyHex} index={index} host={unescape(host)} />}
      </div>
    </main>
  );
}
