import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
import { saveAs } from "file-saver";
import { useHistory } from "react-router-dom";
import CredFields from "components/credFields";

export default function Exit() {
  const [credState, setCredState] = useState<string>();
  const history = useHistory();

  useEffect(() => {
    setCredState(dumpState());
  }, []);

  const [manualOverride, setManualOverride] = useState(false);
  function handleCheck(checked: boolean) {
    setManualOverride(checked);
  }

  function handleExit(id?: string, creds?: string) {
    if (!creds || !credState) {
      return;
    }

    try {
      const credsMatch =
        JSON.stringify(JSON.parse(creds)) ===
        JSON.stringify(JSON.parse(credState));
      const exitOk = manualOverride || credsMatch;
      if (!exitOk) {
        return;
      }
    } catch (e) {
      return;
    }

    localStorage.clear();
    history.push("/");
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4">exit</h1>
      <p>
        To prove you have stored your credentials, autofill them here from your
        password manager. If you don't have your creds, there is absolutely no
        way to regain access to your account. Game over, man.
      </p>

      <CredFields onSubmit={handleExit} ctaText="Exit" />

      <label className="block">
        <input
          type="checkbox"
          checked={manualOverride}
          onChange={() => handleCheck(!manualOverride)}
          className="mr-1"
        />
        I know what I'm doing.
      </label>
    </div>
  );
}
