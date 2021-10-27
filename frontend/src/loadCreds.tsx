import CredFields from "components/credFields";
import { getPrivateKey, getPublicKey, getToken } from "lib/auth";
import { loadState, setToken } from "lib/storage";
import { useState } from "react";
import { useHistory } from "react-router-dom";

export default function LoadCreds() {
  const history = useHistory();
  const [status, setStatus] = useState("");

  const next = new URLSearchParams(history.location.search).get('next');

  async function fetchToken() {
    const pubKey = await getPublicKey();
    if (!pubKey) {
      return;
    }
    const privKey = await getPrivateKey("ECDSA");
    if (!privKey) {
      return;
    }
    const token = await getToken(pubKey, privKey, setStatus);

    if (!token) {
      setStatus("Failed to get token.");
      return;
    }
    setToken(token);
    history.push(next ? next : "/");
  }

  function handleLoad(id?: string, creds?: string) {
    if (!creds) {
      return;
    }

    setStatus("Loading creds...")
    loadState(creds);
    setStatus("Loaded creds.")
    
    fetchToken();
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
