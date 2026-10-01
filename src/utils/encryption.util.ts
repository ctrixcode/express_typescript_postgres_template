import * as crypto from 'crypto';
import { appConfig } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 12-byte IV for GCM mode (NIST SP 800-38D)
const ENCRYPTION_KEY = Buffer.from(appConfig.APP.ENCRYPTION_KEY, 'utf-8');

export interface EncryptedData {
  iv: string;
  encryptedData: string;
  tag: string;
}

/**
 * Encrypts plaintext using AES-256-GCM authenticated encryption.
 * Automatically generates a unique, cryptographically secure 12-byte IV.
 *
 * @param text The plaintext string to encrypt.
 * @returns Object containing hex-encoded IV, encryptedData, and authentication tag.
 */
export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    tag,
  };
}

/**
 * Decrypts AES-256-GCM ciphertext.
 * Verifies the authentication tag to ensure ciphertext integrity and authenticity.
 *
 * @param encryptedData Hex-encoded encrypted data.
 * @param iv Hex-encoded initialization vector.
 * @param tag Hex-encoded authentication tag.
 * @returns Decrypted plaintext string.
 */
export function decrypt(
  encryptedData: string,
  iv: string,
  tag: string
): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
