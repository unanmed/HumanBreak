export function uniqueSymbol() {
    return Math.ceil(Math.random() * 0xefffffff + 0x10000000).toString(16);
}

export function formatSize(size: number) {
    return size < 1 << 10
        ? `${size.toFixed(2)}B`
        : size < 1 << 20
        ? `${(size / (1 << 10)).toFixed(2)}KB`
        : size < 1 << 30
        ? `${(size / (1 << 20)).toFixed(2)}MB`
        : `${(size / (1 << 30)).toFixed(2)}GB`;
}
