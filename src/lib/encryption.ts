import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import { env } from '@/lib/env';
import { INTEGRATION_MESSAGES, isTaxEncryptionConfigured } from '@/lib/integrations';

function taxKey(): Buffer {
  if (!isTaxEncryptionConfigured() || !env.TAX_ENCRYPTION_KEY) {
    throw new Error(INTEGRATION_MESSAGES.taxEncryption);
  }
  return Buffer.from(env.TAX_ENCRYPTION_KEY, 'hex');
}

export function encryptTaxId(ssn: string): string {
  const key = taxKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(ssn, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);
  return '\\x' + combined.toString('hex');
}

export function decryptTaxId(hexData: string): string {
  const key = taxKey();
  const raw = hexData.startsWith('\\x') ? hexData.slice(2) : hexData;
  const data = Buffer.from(raw, 'hex');
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

export function maskSsn(hexData: string): string {
  try {
    const ssn = decryptTaxId(hexData);
    return `···-··-${ssn.slice(-4)}`;
  } catch {
    return '···-··-????';
  }
}
