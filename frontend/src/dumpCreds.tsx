import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { Link, useLocation } from "react-router-dom";
import { usePublicKeyHex } from "lib/auth";

function CredDumper() {
  const [reveal, setReveal] = useState(false)
  const [credState, setCredState] = useState<string>();

  useEffect(() => {
    const creds = dumpState();
    if (!creds) { 
      return;
    }
    setCredState(creds);
  }, [])

  const [saved, setSaved] = useState(false);
  function handleSave() {
    if (!credState) {
      return;
    }

    const blob = new Blob([credState], { type: "text/plain;charset=utf-8" })
    saveAs(blob, "neopub.json");
    setSaved(true);
  }

  const placeholder = credState?.replace(/\w/g, "*");

  return (
    <div className="flex flex-col my-4">
      <button onClick={handleSave} className="mb-4">Save Creds</button>
      <textarea className="w-full h-48 rounded font-mono text-xs" value={reveal ? credState : placeholder} readOnly />
      <button onClick={() => setReveal(!reveal)}>{reveal ? "Conceal" : "Reveal"}</button>
    </div>
  )
}

export default function DumpCreds() {
  const pubKeyHex = usePublicKeyHex();
  const location = useLocation();

  const next = new URLSearchParams(location.search).get('next');

  return (
    <div className="max-w-lg flex flex-col">
      <h1 className="mb-4">credentials</h1>
      <p className="mb-2">
        This is your identity (an ECDSA keypair).
      </p> 
      <p className="mb-2">
        Store it securely. If you lose it, you are lost.
      </p>
      <p className="mb-2">
        No one can help you regain access to your account.
      </p>
      <p className="mb-2">
        Also included: the encryption key for your public posts.
      </p>
      <CredDumper />
      <Link className="self-end" to={next ? next : `/users/${pubKeyHex}`}>Profile &gt;</Link>
    </div>
  );
}
