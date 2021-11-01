const bitsPerByte = 8;
const numHashBytes = 32; // SHA-256
export const numHashBits = numHashBytes * bitsPerByte;

export function inc(arr: Uint8Array) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] < 0xff) {
      arr[i] += 1;
      return;
    }

    arr[i] = 0;
  }

  return -1;
}

export default class PoW {
  crypto;
  constructor(crypto: any) {
    this.crypto = crypto;
  }

  public lessThan2ToN(num: Uint8Array, N: number): boolean {
    const totalBits = num.byteLength * bitsPerByte;
    if (N >= totalBits) {
      return true;
    }

    const numZeroBits = totalBits - N;
    const numRemainderBits = numZeroBits % 8;
    const numZeroBytes = (numZeroBits - numRemainderBits) / 8;

    let i: number;
    for (i = 0; i < numZeroBytes; i++) {
      if (num[i] !== 0) {
        return false;
      }
    }

    if (numRemainderBits !== 0) {
      const x = 0x1 << (8 - numRemainderBits);
      return num[i] < x;
    }

    return true;
  }

  async solve(seed: Uint8Array, N: number) {
    // Goal, find key s.t. sha256(seed ++ key) < 2**N.

    // Brute-force search all possible key values.
    const numBytes = 32;
    const candidate = new Uint8Array(numBytes);

    while (inc(candidate) !== -1) {
      const test = await this.hash(candidate, seed);
      if (this.lessThan2ToN(test, N)) {
        return candidate;
      }
    }

    return null;
  }

  async hash(key: Uint8Array, seed: Uint8Array) {
    const test = new Uint8Array(key.length + seed.length);
    test.set(seed, 0);
    test.set(key, seed.length);

    const hash = await this.crypto.subtle.digest("SHA-256", test);
    return new Uint8Array(hash);
  }

  async test() {
    const numHashBits = numHashBytes * bitsPerByte;

    const difficulty = 14;

    const seed = this.crypto.getRandomValues(new Uint8Array(16));

    const solution = await this.solve(seed, numHashBits - difficulty);
    if (!solution) {
      console.log("No solution found.");
      return;
    }

    // const solh = await this.hash(solution, seed);
    // console.log({ seed, solution, solh });
  }
}
