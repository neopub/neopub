import PoW, { numHashBits } from "./pow";

export default async function solvePoWChallenge(
  chal: Uint8Array,
  diff: number,
): Promise<Uint8Array | null> {
  const pow = new PoW(crypto);
  const solution = await pow.solve(chal, numHashBits - diff);
  return solution;
}
