import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { useLocation, useHistory } from "react-router-dom";
import { usePublicKeyHex } from "lib/auth";

function CredDumper({ nextURL }: { nextURL: string | undefined }) {
  const [reveal, setReveal] = useState(false);
  const [credState, setCredState] = useState<string>();
  const history = useHistory();

  useEffect(() => {
    const creds = dumpState();
    if (!creds) {
      return;
    }
    setCredState(creds);
  }, []);

  const [saved, setSaved] = useState(false);
  function handleSave() {
    if (!credState) {
      return;
    }

    const blob = new Blob([credState], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "neopub.json");
    setSaved(true);
  }

  const placeholder = credState?.replace(/\w/g, "*");

  function handleSubmit(evt: any) {
    evt.preventDefault();

    if (!username || !nextURL) {
      return;
    }

    history.push(nextURL);
  }

  const [username, setUsername] = useState();
  function handleUsernameChange(e: any) {
    setUsername(e.target.value);
  }

  return (
    <div className="flex flex-col my-4">
      <button onClick={handleSave} className="mb-4">
        Export Creds
      </button>
      <textarea
        className="w-full h-48 rounded font-mono text-xs"
        value={reveal ? credState : placeholder}
        readOnly
      />
      <button onClick={() => setReveal(!reveal)}>
        {reveal ? "Conceal" : "Reveal"}
      </button>
      <form action="#" onSubmit={handleSubmit}>
        <input
          id="new-username"
          name="pubkey"
          type="text"
          autoComplete="username"
          value={username}
          placeholder="Enter a name to store this identity in your browser"
          onChange={handleUsernameChange}
          className="block w-96 px-2 py-1 my-2"
        />
        <input
          id="new-password"
          name="privkey"
          type="password"
          autoComplete="new-password"
          value={credState}
          className="block w-96 px-2 py-1 my-2"
        />
        <button type="submit" disabled={!username || !credState}>
          Save Creds
        </button>
      </form>
    </div>
  );
}

export default function DumpCreds() {
  const pubKeyHex = usePublicKeyHex();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next");

  return (
    <div className="max-w-lg flex flex-col">
      <h1 className="mb-4">credentials</h1>
      <p className="mb-2">This is your identity (an ECDSA keypair).</p>
      <p className="mb-2">Store it securely. If you lose it, you are lost.</p>
      <p className="mb-2">No one can help you regain access to your account.</p>
      <p className="mb-2">
        Also included: the encryption key for your public posts.
      </p>
      <CredDumper nextURL={next ? next : `/users/${pubKeyHex}`} />
    </div>
  );
}
