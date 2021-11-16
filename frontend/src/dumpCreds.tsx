import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { useLocation, useHistory } from "react-router-dom";
import { usePublicKeyHex } from "lib/auth";
import CredFields from "components/credFields";
import KnowMore from "components/knowMore";

function More() {
  const [reveal, setReveal] = useState(false);
  const [credState, setCredState] = useState<string>();

  useEffect(() => {
    const creds = dumpState();
    if (!creds) {
      return;
    }
    setCredState(creds);
  }, []);

  function handleCopy() {
    if (!credState) {
      return;
    }
    navigator.clipboard.writeText(credState);
    alert("Copied creds to clipboard. Save these somewhere secure.")
  }

  const placeholder = credState?.replace(/\w/g, "*");

  return (
    <div className="flex flex-col my-4 space-y-2">
      <p className="">These are your credentials (an ECDSA keypair, etc...). They are pre-populated into the password field, so you can easily store them in your password manager.</p>
      <p>To manually save your credentials, use the copy button, below.</p>
      <textarea
        className="w-full h-48 rounded font-mono text-xs mt-2"
        value={reveal ? credState : placeholder}
        readOnly
      />
      <div className="flex mb-4 space-x-2">
        <button onClick={() => setReveal(!reveal)} className="flex-1">
          {reveal ? "Conceal" : "Reveal"}
        </button>
        <button onClick={handleCopy}>Copy</button>
      </div>
    </div>
  );
}

function CredDumper({ nextURL }: { nextURL: string | undefined }) {
  const [credState, setCredState] = useState<string>();
  const history = useHistory();

  useEffect(() => {
    const creds = dumpState();
    if (!creds) {
      return;
    }
    setCredState(creds);
  }, []);

  function handleSubmit(username?: string, creds?: string) {
    if (!username || !nextURL) {
      return;
    }

    history.push(nextURL);
  }

  return (
    <div className="flex flex-col my-4 space-y-3">
      <p>Enter an ID, hit Save Creds.</p>
      <p>This ID is <b>private</b>. It's <i>only</i> used to identify this account in your password manager.</p>
      <p>Save in your password manager, when it asks.</p>

      <CredFields fixedCreds={credState} onSubmit={handleSubmit} ctaText="Save Creds" />
    </div>
  );
}

export default function DumpCreds() {
  const { hex: pubKeyHex } = usePublicKeyHex();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next");

  return (
    <div className="max-w-lg flex flex-col">
      <h1 className="mb-4">credentials</h1>
      <CredDumper nextURL={next ? next : `/users/${pubKeyHex}`} />
      <KnowMore more={<More />} />
    </div>
  );
}
