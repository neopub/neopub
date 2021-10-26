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
      <textarea
        className="w-full h-48 rounded font-mono text-xs"
        value={reveal ? credState : placeholder}
        readOnly
      />
      <div className="flex mb-4 space-x-2">
        <button onClick={handleSave} className="flex-1">
          Export Creds
        </button>
        <button onClick={() => setReveal(!reveal)} className="flex-1">
          {reveal ? "Conceal" : "Reveal"}
        </button>
      </div>

      <p className="mb-2">Store these credentials in your password manager, by entering an ID below and hitting Save Creds. No one can help you regain access to your account.</p>

      <form action="#" onSubmit={handleSubmit} className="sm:max-w-full max-w-96">
        <label htmlFor="id">ID</label>
        <input
          id="new-username"
          name="id"
          type="text"
          autoComplete="username"
          value={username}
          placeholder="Enter an ID for your password manager"
          onChange={handleUsernameChange}
          className="block px-2 py-1 my-2 w-full"
        />
        <label htmlFor="secrets">Creds</label>
        <input
          id="new-password"
          name="creds"
          type="password"
          autoComplete="new-password"
          value={credState}
          className="block px-2 py-1 my-2 w-full"
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
      <p className="">These are your credentials (an ECDSA keypair, etc...).</p>
      <CredDumper nextURL={next ? next : `/users/${pubKeyHex}`} />
    </div>
  );
}
