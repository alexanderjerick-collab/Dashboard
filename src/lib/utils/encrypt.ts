import CryptoJS from "crypto-js";

const KEY = process.env.ENCRYPTION_KEY || "default-32-char-key-replace-me!!";

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
