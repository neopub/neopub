import Hexatar from "components/hexatar";
import HexString from "components/hexString";
import KnowMore from "components/knowMore";
import { sendSubRequest } from "lib/api";
import DB from "lib/db";
import { hostPrefix } from "lib/net";
import { fetchState, putState } from "lib/state";
import { addSubscriptionPubKey } from "lib/storage";
import { useProfile } from "lib/useJSON";
import { useID } from "models/id";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";

export default function Sub() {
  const history = useHistory();
  const id = useID();
  const [sentReq, setSentReq] = useState(false);

  const { id: pubId } = useParams<{ id: string }>();

  const [following, setFollowing] = useState(false);
  useEffect(() => {
    DB.subscriptions.get(pubId)
      .then((sub: any) => {
        setFollowing(sub !== undefined);
      });
  }, [pubId]);
  
  const host = hostPrefix;
  const [profile] = useProfile(pubId, host);
  if (!profile || profile === "notfound") {
    return <div>404 Not Found</div>;
  }
  
  if (!pubId) {
    return null;
  }

  async function handleSubscribe() {
    if (!pubId || !history || !profile || profile === "notfound") {
      return;
    }

    if (!id) {
      alert('You need an identity first.')
      history.push(`/?next=${encodeURIComponent(history.location.pathname)}`);
      return;
    }

    if (id.pubKey.hex === pubId) {
      alert("You can't follow yourself.");
      return;
    }

    const msg = prompt("Enter a message to include with the request (optional).")
    if (msg == null) {
      return;
    }

    const worldKeyHex = profile.worldKey;

    await sendSubRequest(pubId, id.pubKey.hex, msg, host, host);

    // NOTE: race condition.
    await fetchState();
    addSubscriptionPubKey(pubId, host, worldKeyHex, profile.handle);
    await putState();

    setSentReq(true);
  }

  return (
    <main className="max-w-lg">
      <h1 className="mb-8">follow</h1>
      <div className="space-y-2">
        <p>When you follow someone, you'll get their public posts in your feed.</p>
        <p>If they accept your follow request, you'll also see their private posts.</p>
      </div>

      <div className="my-6">
        <Link className="flex flex-row items-center space-x-2 no-underline mb-2" to={`/users/${pubId}`}>
          <Hexatar hex={pubId} />
          <HexString hex={pubId} />
          {profile.handle}
        </Link>
        {
          sentReq ? <div>Sent follow request.</div> : <button className="w-64 py-2 px-6" onClick={handleSubscribe} disabled={following}>{following ? "Following" : "Follow"}</button>
        }
      </div>

      <KnowMore more={
        <div>
          <Link to="/arch/sub">Read about how following works.</Link>
        </div>
      } />
    </main>
  );
}