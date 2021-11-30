import Access from "../components/access";
import Profile from "../components/profile";
import { IdentityContext } from "models/id";
import { useContext } from "react";

function App() {
  const ident = useContext(IdentityContext);

  if (ident === undefined) {
    return null;
  }

  const hasAccess = ident?.token != null;

  return hasAccess ? (
    ident ? <Profile id={ident.pubKey.hex} /> : null
  ) : (
    <Access />
  );
}

export default App;
