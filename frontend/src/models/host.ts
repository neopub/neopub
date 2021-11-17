import solvePoWChallenge from "core/challenge";
import { getUserAuthChallenge, getSessionToken } from "lib/api";


export async function getToken(pubKey: CryptoKey, privKey: CryptoKey, setStatus: (status: string) => void) {
  setStatus("Initiating challenge...");
  const { chal, diff } = await getUserAuthChallenge(pubKey);

  setStatus("Searching for solution...");
  const solution = await solvePoWChallenge(chal, diff);
  if (!solution) {
    setStatus("No solution found.");
    return;
  }
  setStatus("Found solution.");

  const token = await getSessionToken(
    privKey,
    pubKey,
    solution
  );
  setStatus(`Got access token.`);

  return token;
}
