/**
 * LoRaWAN DevEUI utilities (IEEE EUI-64 format: 16 uppercase hexadecimal digits)
 */

const HEX_CHARS = "0123456789ABCDEF";

/**
 * Generates a random 16-character hexadecimal DevEUI.
 * Defaults to using Milesight's OUI prefix (24E124) + 10 random hex characters.
 */
export function generateRandomEui(prefix = "24E124"): string {
  let eui = prefix;
  while (eui.length < 16) {
    const randIndex = Math.floor(Math.random() * HEX_CHARS.length);
    eui += HEX_CHARS[randIndex];
  }
  return eui.slice(0, 16);
}

/**
 * Deterministically derives a 16-hex character DevEUI from a string key/id.
 */
export function fallbackEuiFromKey(key: string, prefix = "24E124"): string {
  let hash1 = 0;
  let hash2 = 5381;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 |= 0;
    hash2 = ((hash2 << 5) + hash2) + char;
    hash2 |= 0;
  }

  const part1 = Math.abs(hash1).toString(16).toUpperCase().padStart(8, "0");
  const part2 = Math.abs(hash2).toString(16).toUpperCase().padStart(8, "0");
  const combined = (part1 + part2);

  return (prefix + combined).slice(0, 16);
}
