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
    <div className="flex flex-col my-4">
      <CredFields onSubmit={handleLoad} ctaText="Load Creds" />
      {status}
    </div>
  );
}
