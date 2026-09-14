import * as Crypto from "expo-crypto";

// Hermes has no crypto.getRandomValues; the Base44 SDK's uuid dependency needs it.
// expo-crypto exposes a compatible implementation but does not install it globally.
type CryptoLike = { getRandomValues?: unknown };
const globalWithCrypto = globalThis as { crypto?: CryptoLike };

if (!globalWithCrypto.crypto) {
  globalWithCrypto.crypto = {};
}
if (typeof globalWithCrypto.crypto.getRandomValues !== "function") {
  globalWithCrypto.crypto.getRandomValues = Crypto.getRandomValues;
}
