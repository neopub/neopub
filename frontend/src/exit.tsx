import { useEffect, useState } from "react";
import { dumpState } from "lib/storage";
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
    function exit() {
      localStorage.clear();
      history.push("/");
    }

    if (manualOverride) {
      exit();
    }

    if (!creds || !credState) {
      return;
    }

    try {
      const credsMatch =
        JSON.stringify(JSON.parse(creds ?? "")) ===
        JSON.stringify(JSON.parse(credState ?? " "));
      const exitOk = manualOverride || credsMatch;
      if (!exitOk) {
        alert("Creds don't match. Try again.");
        return;
      }
    } catch (e) {
      return;
    }

    exit();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4">exit</h1>
      <p>
        To prove you stored your credentials, use your password manager to fill
        them here.
      </p>

      <CredFields onSubmit={handleExit} ctaText="Exit" submitEnabledManualOverride={manualOverride} />

      <p className="mt-2">
        If you exit without having stored your creds, there is absolutely no way
        to regain access to your account. Game over, man.
      </p>

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
