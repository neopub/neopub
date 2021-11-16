import { useRef, useState } from "react";

export default function CredFields({
  onSubmit,
  fixedCreds,
  ctaText,
  submitEnabledManualOverride,
}: {
  onSubmit: (username?: string, creds?: string) => void;
  fixedCreds?: string;
  ctaText: string;
  submitEnabledManualOverride?: boolean;
}) {
  const idFieldRef = useRef<HTMLInputElement>(null);
  const credFieldRef = useRef<HTMLInputElement>(null);

  const [id, setID] = useState("");
  const [creds, setCreds] = useState("");
  function handleIDChange(e: any) {
    setID(e.target.value);
  }

  function handleCredsChange(e: any) {
    setCreds(e.target.value);
  }

  function handleSubmit(evt: any) {
    evt.preventDefault();
    onSubmit(id, creds);
  }

  const missingId = !id;
  const missingCreds = !(fixedCreds ?? creds);
  let submitDisabled =  missingId || missingCreds;
  if (submitEnabledManualOverride) {
    submitDisabled = false;
  }
  
  const isLoading = fixedCreds == null;

  return (
    <form action="#" onSubmit={handleSubmit} className="sm:max-w-full max-w-96">
      <label htmlFor="id">ID</label>
      <input
        ref={idFieldRef}
        name="id"
        type="text"
        id={isLoading ? "username" : "new-username"}
        autoComplete="username"
        value={id}
        placeholder="Enter an ID for your password manager"
        onChange={handleIDChange}
        className="block px-2 py-1 my-2 w-full"
      />
      <label htmlFor="creds">Creds</label>
      <input
        ref={credFieldRef}
        name="creds"
        type="password"
        id={isLoading ? "password" : "new-password"}
        autoComplete={isLoading ? "password" : "new-password"}
        value={fixedCreds ?? creds}
        onChange={isLoading ? handleCredsChange : undefined}
        className="block px-2 py-1 my-2 w-full"
      />
      <button type="submit" className="w-full" disabled={submitDisabled}>
        {ctaText}
      </button>
    </form>
  );
}
