/**
 * Polyfill - Standard 41DEVS
 * Compatibilite crypto pour Node.js
 */
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}
