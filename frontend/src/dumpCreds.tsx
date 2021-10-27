import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { useLocation, useHistory } from "react-router-dom";
import { usePublicKeyHex } from "lib/auth";
import CredFields from "components/credFields";

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

  const placeholder = credState?.replace(/\w/g, "*");

  function handleSubmit(username?: string, creds?: string) {
    if (!username || !nextURL) {
      return;
    }

    history.push(nextURL);
  }

  return (
    <div className="flex flex-col my-4">
      <textarea
        className="w-full h-48 rounded font-mono text-xs"
        value={reveal ? credState : placeholder}
        readOnly
      />
      <div className="flex mb-4 space-x-2">
        <button onClick={() => setReveal(!reveal)} className="flex-1">
          {reveal ? "Conceal" : "Reveal"}
        </button>
      </div>

      <p className="mb-2">Enter an ID and hit Save Creds. That triggers your browser's password manager.</p>

      <CredFields fixedCreds={credState} onSubmit={handleSubmit} ctaText="Save Creds" />
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
      <p className="">These are your credentials (an ECDSA keypair, etc...). Store them in your password manager.</p>
      <CredDumper nextURL={next ? next : `/users/${pubKeyHex}`} />
    </div>
  );
}
