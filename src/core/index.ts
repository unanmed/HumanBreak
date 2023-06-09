export {};

declare global {
    interface AncTe {}
    interface Window {
        ancTe: AncTe;
    }
    const ancTe: AncTe;
}
// @ts-ignore
window.ancTe = {};
