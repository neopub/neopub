import { bytes2hex, hex2bytes } from "../core/bytes";

it("hex2bytes", () => {
  expect(hex2bytes("FF")?.[0]).toBe(255);
  expect(hex2bytes("FF00")?.[0]).toBe(255);
  expect(hex2bytes("FF00")?.[1]).toBe(0);
  expect(hex2bytes("F")).toBeNull();
});

it("bytes2hex", () => {
  expect(bytes2hex(new Uint8Array([0xff]))).toBe("FF");
  expect(bytes2hex(new Uint8Array([]))).toBe("");
  expect(bytes2hex(new Uint8Array([0x01, 0x02]))).toBe("0102");
});
