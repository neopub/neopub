import KnowMore from "components/knowMore";
import { sendSubRequest } from "lib/api";
import DB from "lib/db";
import { hostPrefix } from "lib/net";
import { mutateState } from "models/state";
import { addSubscriptionPubKey } from "lib/storage";
import { follow, useProfile } from "models/profile";
import { IdentityContext } from "models/id";
import { useContext, useEffect } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import HexIDCard from "components/hexIdCard";

export default function Sub() {
  const navigate = useNavigate();
  const location = useLocation();
  const ident = useContext(IdentityContext);
  const [sentReq, setSentReq] = useState(false);

  const params = useParams<"id">();
  const pubId = params["id"];

  const [following, setFollowing] = useState(false);
  useEffect(() => {
    if (!pubId) {
      return;
    }

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
    if (!pubId || !navigate || !location || !profile || profile === "notfound") {
      return;
    }

    if (!ident) {
      alert('You need an identity first.')
      navigate(`/?next=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (ident.pubKey.hex === pubId) {
      alert("You can't follow yourself.");
      return;
    }

    const msg = prompt("Enter a message to include with the request (optional).")
    if (msg == null) {
      return;
    }

    const worldKeyHex = profile.worldKey;

    await sendSubRequest(pubId, ident.pubKey.hex, msg, host, host);

    await mutateState(async () => {
      await follow(pubId, profile);
      return addSubscriptionPubKey(pubId, host, worldKeyHex, profile.handle);
    });

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
        <HexIDCard pubKey={pubId} host={host} handle={profile.handle} />
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