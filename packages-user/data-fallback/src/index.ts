import { patchBattle } from './battle';
import { patchDamage } from './damage';

export function patchAll() {
    patchBattle();
    patchDamage();
}
