import { initChase as init1 } from './chase1';

const chaseIndexes: Record<number, () => void> = {
    0: init1
};

export function startChase(index: number) {
    chaseIndexes[index]();
}
