import CredFields from "components/credFields";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { identify } from "models/id";

export default function LoadCreds() {
  const history = useHistory();
  const [status, setStatus] = useState("");

  const next = new URLSearchParams(history.location.search).get('next');

  async function handleLoad(id?: string, creds?: string) {
    if (!creds) {
      return;
    }

    const failed = await identify(creds, setStatus);
    if (failed) {
      return;
    }

    history.push(next ? next : "/");
  }

  return (
    <div className="max-w-lg flex flex-col">
      <h1 className="mb-4">load</h1>
      <p className="mb-4">Load credentials from your password manager. If you don't have creds, go back and create some.</p>
      <CredFields onSubmit={handleLoad} ctaText="Load Creds" />
      {status}
    </div>
  );
}
