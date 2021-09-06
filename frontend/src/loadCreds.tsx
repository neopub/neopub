import { getPrivateKey, getPublicKey, getToken } from "lib/auth";
import { loadState, setToken } from "lib/storage";
import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

export default function LoadCreds() {
  const history = useHistory();
  const [loaded, setLoaded] = useState(false);
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

  async function handleFileSelected(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) {
      return;
    }
    
    const fr = new FileReader();
    fr.onload = function (evt) {
      const creds = evt.target?.result as string;
      if (!creds) {
        setStatus("No creds.");
        return;
      }
  
      setStatus("Loading creds...")
      loadState(creds);
      setStatus("Loaded creds.")
      setLoaded(true);
      
      fetchToken();
    };
    fr.readAsText(file);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  function handleLoadClicked(evt: React.MouseEvent) {
    evt.preventDefault();
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col my-4">
      <button onClick={handleLoadClicked}>
        Load creds (neopub.json)
      </button>
      <input
        ref={fileInputRef}
        className="hidden"
        name="load"
        type="file"
        accept=".json"
        multiple={false}
        onChange={handleFileSelected}
      />
      {status}
    </div>
  );
}
