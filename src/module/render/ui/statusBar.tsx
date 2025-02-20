import { GameUI } from '@/core/system';
import { defineComponent } from 'vue';
import { SetupComponentOptions } from '../components';
import { ElementLocator } from '@/core/render';

export interface IHeroStatus {
    hp: number;
    atk: number;
    def: number;
    mdef: number;
}

interface StatusBarProps {
    loc: ElementLocator;
    status: IHeroStatus;
}

const statusBarProps = {
    props: ['loc', 'status']
} satisfies SetupComponentOptions<StatusBarProps>;

export const StatusBar = defineComponent<StatusBarProps>(p => {
    const hpIcon = core.material.images.images['hp.png'];
    const atkIcon = core.material.images.images['atk.png'];
    const defIcon = core.material.images.images['def.png'];
    const mdefIcon = core.material.images.images['IQ.png'];

    const s = p.status;
    const f = core.formatBigNumber;

    const iconLoc = (n: number): ElementLocator => {
        return [16, 16 + 48 * n, 32, 32];
    };

    const textLoc = (n: number): ElementLocator => {
        return [64, 32 + 48 * n, void 0, void 0, 0.5, 0.5];
    };

    return () => {
        return (
            <container loc={p.loc}>
                <g-rect loc={[0, 0, p.loc[2], p.loc[3]]} stroke></g-rect>
                <image image={hpIcon} loc={iconLoc(0)}></image>
                <text text={f(s.hp)} loc={textLoc(0)}></text>
                <image image={atkIcon} loc={iconLoc(1)}></image>
                <text text={f(s.atk)} loc={textLoc(1)}></text>
                <image image={defIcon} loc={iconLoc(2)}></image>
                <text text={f(s.atk)} loc={textLoc(2)}></text>
                <image image={mdefIcon} loc={iconLoc(3)}></image>
                <text text={f(s.atk)} loc={textLoc(3)}></text>
            </container>
        );
    };
}, statusBarProps);

export const statusBarUI = new GameUI('status-bar', StatusBar);
