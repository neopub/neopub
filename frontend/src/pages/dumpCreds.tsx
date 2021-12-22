import { useContext, useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { useLocation, useNavigate } from "react-router-dom";
import CredFields from "components/credFields";
import KnowMore from "components/knowMore";
import { IdentityContext } from "models/id";
import { saveAs } from 'file-saver';

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

  async function handleSave() {
    if (!credState) {
      return;
    }

    const blob = new Blob([credState], { type: "application/json;charset=utf-8" });
    saveAs(blob, "id.json");
  }

  const placeholder = credState?.replace(/\w/g, "*");

  return (
    <div className="flex flex-col my-4 space-y-2">
      <p className="">These are your credentials (an ECDSA keypair, etc...). They are pre-populated into the password field, so you can easily store them in your password manager.</p>
      <p>To manually save your credentials, use the save button, below.</p>
      <textarea
        className="w-full h-48 rounded font-mono text-xs mt-2"
        value={reveal ? credState : placeholder}
        readOnly
      />
      <div className="flex mb-4 space-x-2">
        <button onClick={() => setReveal(!reveal)} className="flex-1">
          {reveal ? "Conceal" : "Reveal"}
        </button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}

function CredDumper({ nextURL }: { nextURL: string | undefined }) {
  const [credState, setCredState] = useState<string>();
  const navigate = useNavigate();

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

    navigate(nextURL);
  }

  return (
    <div className="flex flex-col my-4 space-y-3">
      <p>Enter an ID, then hit Save Creds.</p>
      <p>This ID is <b>private</b>. It's <i>only</i> used to identify this account in your password manager.</p>
      <p>Save in your password manager, when it asks (supports Chrome and Safari; for 1Password, <i>right-click ID field &gt; 1Password &gt; Save Login</i>).</p>

      <CredFields fixedCreds={credState} onSubmit={handleSubmit} ctaText="Save Creds" />
    </div>
  );
}

export default function DumpCreds() {
  const ident = useContext(IdentityContext);
  const location = useLocation();

  const next = new URLSearchParams(location.search).get("next");

  return (
    <div className="max-w-lg flex flex-col">
      <h1 className="mb-4">credentials</h1>
      <CredDumper nextURL={next ? next : `/users/${ident?.pubKey.hex}`} />
      <KnowMore label="Other options" more={<More />} />
    </div>
  );
}
