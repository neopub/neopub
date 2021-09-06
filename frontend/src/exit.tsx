import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { saveAs } from 'file-saver';
import { useHistory } from "react-router-dom";

export default function Exit() {
  const [credState, setCredState] = useState<string>();
  const [saved, setSaved] = useState(false);
  const history = useHistory();

  useEffect(() => {
    setCredState(dumpState());
  }, [])

  const [manualOverride, setManualOverride] = useState(false);
  function handleCheck(checked: boolean) {
    setManualOverride(checked);
  }

  const exitOk = saved || manualOverride;

  function handleSave() {
    if (!credState) {
      return;
    }

    const blob = new Blob([credState], { type: "text/plain;charset=utf-8" })
    saveAs(blob, "neopub.json");
    setSaved(true);
  }

  function handleExit() {
    if (!exitOk) {
      return;
    }

    localStorage.clear();
    history.push("/");
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4">exit</h1>
      <p>
        You must save your creds before exiting. If you don't save your creds, there is absolutely no way to regain access to your account. Game over, man.
      </p>
      <label className="block">
        <input type="checkbox" checked={manualOverride} onChange={() => handleCheck(!manualOverride)} className="mr-1" />
        I know what I'm doing.
      </label>
      <button onClick={handleSave}>Save Creds</button>
      <button disabled={!exitOk} onClick={handleExit}>Exit</button>
    </div>
  )
}
