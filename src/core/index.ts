export {};

declare global {
    interface AncTe {}
    interface Window {
        readonly ancTe: AncTe;
    }
    const ancTe: AncTe;
}
// @ts-ignore
window.ancTe = {};
