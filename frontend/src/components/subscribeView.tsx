import { sendSubRequest } from "lib/api";
import { getProfile } from "lib/net";
import { addSubscriptionPubKey } from "lib/storage";
import { useState } from "react";

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

    const host = unescape(match[5]);
    if (!host) {
      alert("Host not specified.");
      return;
    }

    const msg = prompt("Enter a message to include with the request (optional).")
    if (msg == null) {
      return;
    }

    const profile = await getProfile(pubPubKeyHex, host);
    if (!profile || profile === "notfound") {
      return;
    }

    const worldKeyHex = profile.worldKey;
    
    await sendSubRequest(pubPubKeyHex, pubKeyHex, msg);
    addSubscriptionPubKey(pubPubKeyHex, host, worldKeyHex);
  }

  return (
    <form onSubmit={handleSubscribe}>
      <input type="text" value={url} onChange={(e) => setURL(e.target.value)} />
      <button type="submit" disabled={!match}>Subscribe</button>
    </form>
  )
}
