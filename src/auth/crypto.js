import * as Crypto from "expo-crypto";

export async function hashText(salt, text) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${text}`);
}

export async function randomHex(bytes = 16) {
  const b = await Crypto.getRandomBytesAsync(bytes);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function randomCode() {
  const b = await Crypto.getRandomBytesAsync(4);
  const n = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
  return String(n % 1000000).padStart(6, "0");
}
