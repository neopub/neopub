import Access from "../components/access";
import { useToken } from "../lib/storage";
import { usePublicKeyHex } from "../lib/auth";
import Profile from "../components/profile";

function App() {
  const { token, loading: loadingToken } = useToken();
  const { hex: pubKeyHex, loading: loadingPubKey } = usePublicKeyHex();

  const loading = loadingToken || loadingPubKey;
  if (loading) {
    return null;
  }

  const hasAccess = token != null;

  return hasAccess ? (
    pubKeyHex ? <Profile id={pubKeyHex} /> : null
  ) : (
    <Access />
  );
}

export default App;
