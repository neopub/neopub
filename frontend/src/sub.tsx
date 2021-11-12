import Hexatar from "components/hexatar";
import HexString from "components/hexString";
import { sendSubRequest } from "lib/api";
import { usePublicKeyHex } from "lib/auth";
import { getProfile, hostPrefix } from "lib/net";
import { addSubscriptionPubKey } from "lib/storage";
import { useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";

export default function Sub() {
  const history = useHistory();
  const { hex: pubKeyHex } = usePublicKeyHex();
  const [sentReq, setSentReq] = useState(false);

  const { id: pubId } = useParams<{ id: string }>();
  if (!pubId) {
    return null;
  }

  async function handleSubscribe() {
    if (!pubId || !history) {
      return;
    }

    if (!pubKeyHex) {
      alert('You need an identity first.')
      history.push(`/?next=${encodeURIComponent(history.location.pathname)}`);
      return;
    }

    if (pubKeyHex === pubId) {
      alert("You can't subscribe to yourself.");
      return;
    }

    const msg = prompt("Enter a message to include with the request (optional).")
    if (msg == null) {
      return;
    }

    const host = hostPrefix;

    const profile = await getProfile(pubId, host);
    if (!profile || profile === "notfound") {
      return;
    }

    const worldKeyHex = profile.worldKey;

    await sendSubRequest(pubId, pubKeyHex, msg, host);
    addSubscriptionPubKey(pubId, host, worldKeyHex, profile.handle);
    setSentReq(true);
  }

  return (
    <div className="max-w-lg">
      <h1>subscribe</h1>
      <div>
        <p>To read a user's private posts, you must first become a subscriber.</p>
        <p>To subscribe, send a request, optionally with a message, and wait for the publisher to accept you.</p>
        <Link to="/arch/sub">Read about how subscribing works.</Link>
      </div>

      <div className="mt-6">
        <Link className="flex flex-row items-center space-x-2 no-underline" to={`/users/${pubId}`}>
          <Hexatar hex={pubId} />
          <HexString hex={pubId} />
        </Link>
        {
          sentReq ? <div>Sent subscription request.</div> : <button onClick={handleSubscribe}>Subscribe</button>
        }
      </div>
    </div>
  );
}