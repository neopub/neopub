import { createProfile } from "models/profile";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";

export default function Access() {
  const [status, setStatus] = useState("");
  const history = useHistory();

  const next = history.location.search;

  async function handleCreateIDClicked() {
    await createProfile(setStatus);
    history.push(`/creds/dump${next}`)
  }

  function handleLoadIDClicked() {
    history.push(`/creds/load${next}`)
  }

  return (
    <div className="mt-24 flex flex-col items-center">
      <div className="flex flex-col items-center">
        <img src="keyboard.png" alt="Pixelated keyboard icon" className="w-40 pt-2 mb-2" />
        <h1 className="mb-8">neopub</h1>
      </div>
      <div className="flex flex-col">
        <p>Neopub is an <Link to="/arch">end-to-end encrypted</Link>, <a href="https://github.com/neopub/neopub">open-source</a>, <Link to="/host">self-hosted</Link> social network.</p>
        <p className="mb-4">In neopub, you don't have an email and password. Your identity is cryptographic.</p>
        <button className="py-3" onClick={handleCreateIDClicked}>Create ID</button>
        <button className="border-0" onClick={handleLoadIDClicked}>Load ID</button>
        {status}
      </div>
    </div>
  );
}
