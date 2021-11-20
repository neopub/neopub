import { sendSubRequest } from "lib/api";
import { getProfile, hostPrefix } from "lib/net";
import { mutateState } from "models/state";
import { addSubscriptionPubKey } from "lib/storage";
import { useState } from "react";
import { follow } from "models/profile";

export default function SubscribeView({ pubKeyHex }: { pubKeyHex: string }) {
  const [url, setURL] = useState("");
  
  const re = new RegExp('(https:\\/\\/|http:\\/\\/)?([a-zA-Z\\./]+(:\\d+)?)\\/users\\/(\\w+?)\\?host=(.+)', 'i');
  const match = re.exec(url);

  async function handleSubscribe(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();

    if (!url || !match) {
      return;
    }

    const pubPubKeyHex = match[4];
    if (pubPubKeyHex === pubKeyHex) {
      alert("You can't subscribe to yourself.");
      return;
    }

    const destHost = unescape(match[5]);
    if (!destHost) {
      alert("Host not specified.");
      return;
    }

    const msg = prompt("Enter a message to include with the request (optional).")
    if (msg == null) {
      return;
    }

    const profile = await getProfile(pubPubKeyHex, destHost);
    if (!profile || profile === "notfound") {
      return;
    }

    const worldKeyHex = profile.worldKey;
    const srcHost = hostPrefix;
    
    await sendSubRequest(pubPubKeyHex, pubKeyHex, msg, destHost, srcHost);

    await mutateState(async () => {
      await follow(pubPubKeyHex, profile);
      return addSubscriptionPubKey(pubPubKeyHex, destHost, worldKeyHex, profile.handle);
    });
  }

  return (
    <div className="mt-4">
      To follow someone from a different host, copy the QR code link from their profile and paste it here.
      <form onSubmit={handleSubscribe} className="space-x-1">
        <input type="text" value={url} onChange={(e) => setURL(e.target.value)} className="py-1 px-3 rounded" placeholder="Paste profile link here" />
        <button type="submit" disabled={!match}>Follow</button>
      </form>
    </div>
  )
}
