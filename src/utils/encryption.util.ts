import * as crypto from 'crypto';
import { appConfig } from '../config';
import { BadRequestError } from '../helpers';

/**
 * AES-256-GCM is an "Authenticated Encryption with Associated Data" (AEAD) cipher.
 * Unlike older modes (e.g. CBC), GCM provides both:
 *  1. Confidentiality (nobody can read the plaintext without the key)
 *  2. Authenticity/Integrity (nobody can tamper with or modify the ciphertext undetected)
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * Standard 12-byte (96-bit) Initialization Vector (IV) recommended by NIST SP 800-38D.
 * A unique IV must be generated for EVERY encryption operation to prevent replay
 * attacks and cryptographic leakage.
 */
const IV_LENGTH = 12;

/**
 * Helper to safely extract a 32-byte (256-bit) Buffer from the environment key.
 *
 * Why this is needed:
 * Node.js crypto requires the key buffer to be PRECISELY 32 bytes.
 * Depending on how developers configure their .env file:
 *  - Option A: A 64-character hex string (e.g. from `crypto.randomBytes(32).toString('hex')`)
 *  - Option B: A standard 32-character ASCII string (e.g. 'my-super-secret-key-32characters')
 *
 * This function handles both formats safely without crashing the server.
 */
const getEncryptionKey = (): Buffer => {
  const rawKey = appConfig.APP.ENCRYPTION_KEY;

  // Case 1: Key is provided as a 64-character hex string (standard production format)
  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  // Case 2: Key is provided as a 32-character UTF-8 string
  const utf8Buffer = Buffer.from(rawKey, 'utf-8');
  if (utf8Buffer.length === 32) {
    return utf8Buffer;
  }

  // Fallback: Ensure the buffer is exactly 32 bytes to prevent crypto runtime crashes
  return Buffer.alloc(32, utf8Buffer);
};

// Singleton key buffer initialized once at startup
const ENCRYPTION_KEY = getEncryptionKey();

export interface EncryptedData {
  /** The 12-byte initialization vector, hex-encoded */
  iv: string;
  /** The encrypted ciphertext, hex-encoded */
  encryptedData: string;
  /** The 16-byte GCM authentication tag, hex-encoded (ensures data has not been tampered with) */
  tag: string;
}

/**
 * Encrypts plaintext using AES-256-GCM authenticated encryption.
 *
 * Steps:
 * 1. Generates a fresh, cryptographically secure 12-byte IV for this payload.
 * 2. Encrypts the plaintext using the 256-bit key and IV.
 * 3. Extracts the 16-byte authentication tag from the cipher.
 *
 * @param text The plaintext string to encrypt.
 * @returns Object containing hex-encoded IV, encryptedData, and auth tag.
 */
export function encrypt(text: string): EncryptedData {
  // Step 1: Create a random 12-byte IV for this specific encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Step 2: Initialize cipher with algorithm, key, and IV
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  // Step 3: Encrypt the plaintext string to hexadecimal
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Step 4: Retrieve the GCM authentication tag
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag,
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext payload and validates its integrity.
 *
 * Steps:
 * 1. Rebuilds the decipher using the same key and the original IV.
 * 2. Attaches the authentication tag.
 * 3. Decrypts the data and verifies the tag.
 *
 * Why the try/catch is critical:
 * If the ciphertext, IV, or tag has been tampered with (or encrypted with a different key),
 * `decipher.final()` throws an internal crypto error: "Unsupported state or unable to authenticate data".
 * Catching this allows us to respond with an operational 400 Bad Request instead of an unhandled 500 crash.
 *
 * @param encryptedData Hex-encoded ciphertext
 * @param iv Hex-encoded initialization vector used during encryption
 * @param tag Hex-encoded authentication tag
 * @returns Original decrypted plaintext string
 */
export function decrypt(
  encryptedData: string,
  iv: string,
  tag: string
): string {
  try {
    // Step 1: Initialize the decipher with the key and original IV
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(iv, 'hex')
    );

    // Step 2: Set the authentication tag to verify data authenticity
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    // Step 3: Decrypt the ciphertext back to UTF-8
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8'); // Throws if tag does not match (tampering detected)

    return decrypted;
  } catch {
    // Operational error: The data was either corrupted, tampered with, or invalid
    throw new BadRequestError(
      'Decryption failed: corrupted data or invalid authentication tag.'
    );
  }
}
