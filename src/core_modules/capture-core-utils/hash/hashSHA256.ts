import { sha256 } from 'js-sha256';

export const hashSHA256 = async (input: string): Promise<string> => {
    if (!window.crypto?.subtle) {
        console.warn('SubtleCrypto API not available, falling back to js-sha256.');
        return sha256(input);
    }

    const inputUint8 = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', inputUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};
