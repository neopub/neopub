import Access from "../components/access";
import Profile from "../components/profile";
import { useID } from "models/id";

function App() {
  const ident = useID();

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
