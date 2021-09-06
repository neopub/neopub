import Access from "./components/access";
import { useToken } from "./lib/storage";
import { usePublicKeyHex } from "./lib/auth";
import Profile from "./components/profile";

function App() {
  const token = useToken();
  const hasAccess = token != null;

  const pubKeyHex = usePublicKeyHex();

  return hasAccess ? (
    pubKeyHex ? <Profile id={pubKeyHex} /> : null
  ) : (
    <Access />
  );
}

export default App;
