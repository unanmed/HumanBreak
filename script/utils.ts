import { createHash } from 'crypto';

export function uniqueSymbol() {
    return Math.ceil(Math.random() * 0xefffffff + 0x10000000).toString(16);
}

export function fileHash(
    content: string | Buffer | Uint8Array,
    length: number = 8
) {
    return createHash('sha256').update(content).digest('hex').slice(0, length);
}

export function formatSize(size: number) {
    if (size < 1 << 10) {
        return `${size.toFixed(2)}B`;
    } else if (size < 1 << 20) {
        return `${(size / (1 << 10)).toFixed(2)}KB`;
    } else if (size < 1 << 30) {
        return `${(size / (1 << 20)).toFixed(2)}MB`;
    } else {
        return `${(size / (1 << 30)).toFixed(2)}GB`;
    }
}
