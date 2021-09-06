import * as Crypto from "crypto";
import PoW, { inc } from "../core/pow";

const webcrypto = (Crypto as any).webcrypto;
const pow = new PoW(webcrypto);

test("lessThan2ToN", () => {
  expect(pow.lessThan2ToN(new Uint8Array([0xff, 0xff, 0xff]), 128)).toBe(true);
  expect(pow.lessThan2ToN(new Uint8Array([0xff, 0xff, 0xff]), 4)).toBe(false);
  expect(pow.lessThan2ToN(new Uint8Array([0xff, 0xff, 0xff]), 1)).toBe(false);
  expect(pow.lessThan2ToN(new Uint8Array([0x00, 0x00, 0x00]), 1)).toBe(true);
  expect(pow.lessThan2ToN(new Uint8Array([0x00, 0x00, 0x03]), 1)).toBe(false);
  expect(pow.lessThan2ToN(new Uint8Array([0x00, 0x00, 0x04]), 2)).toBe(false);
  expect(pow.lessThan2ToN(new Uint8Array([0x00, 0x00, 0x04]), 3)).toBe(true);
  expect(pow.lessThan2ToN(new Uint8Array([0x00, 0x00, 0x0f]), 8)).toBe(true);
  expect(pow.lessThan2ToN(new Uint8Array([0x00, 0x00, 0xff]), 7)).toBe(false);
});

test("genKey", () => {
  // console.log(pow.genKey(128));
});

test("hash", async () => {
  const h = await pow.hash(new Uint8Array([]), new Uint8Array([]));
  expect(h.byteLength).toBe(32);
});

test("run test", async () => {
  await pow.test();
});

test("inc", () => {
  const arr = new Uint8Array([0x00, 0xff, 0xff]);
  inc(arr);
  expect(arr[0]).toBe(0x01);
  expect(arr[1]).toBe(0x00);
  expect(arr[2]).toBe(0x00);
});
