import { storeCredentials, getToken } from "lib/auth";
import { useState } from "react";
import { genIDKeyPair, genSymmetricKey, key2buf } from "core/crypto";
import { Link, useHistory } from "react-router-dom";
import { buf2hex } from "core/bytes";
import { uploadProfile } from "lib/api";

export default function Access() {
  const [status, setStatus] = useState("");
  const history = useHistory();

  const next = history.location.search;

  async function handleCreateIDClicked() {
    const idKeys = await genIDKeyPair();

    const token = await getToken(idKeys.publicKey, idKeys.privateKey, setStatus);
    if (!token) {
      return;
    }

    const worldKey = await genSymmetricKey();

    await storeCredentials(idKeys, token, worldKey);

    // Create profile.
    const worldKeyBuf = await key2buf(worldKey);
    const worldKeyHex = buf2hex(worldKeyBuf);
    const profile = { worldKey: worldKeyHex };
    await uploadProfile(idKeys.publicKey, idKeys.privateKey, token, profile)

    history.push(`/creds/dump${next}`)
  }

  function handleLoadIDClicked() {
    history.push(`/creds/load${next}`)
  }

  return (
    <div className="mt-24 flex flex-col items-center">
      <div className="flex flex-col items-center">
        <img src="keyboard.png" alt="Pixelated keyboard icon" className="w-40 pt-2 mb-2" />
        <h1 className="mb-8">neopub</h1>
      </div>
      <div className="flex flex-col">
        <p>Neopub is an <Link to="/arch">end-to-end encrypted</Link>, <a href="https://github.com/neopub/neopub">open-source</a>, <Link to="/host">self-hosted</Link> social network.</p>
        <p className="mb-4">In neopub, you don't have an email and password. Your identity is cryptographic.</p>
        <button className="py-3" onClick={handleCreateIDClicked}>Create ID</button>
        <button className="border-0" onClick={handleLoadIDClicked}>Load ID</button>
        {status}
      </div>
    </div>
  );
}
