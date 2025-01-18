import { Patch, PatchClass } from '@/common/patch';
import { bgmController } from '../audio';
import { mainSetting } from '@/core/main/setting';

export function patchAudio() {
    const patch = new Patch(PatchClass.Control);

    const play = (bgm: BgmIds, when?: number) => {
        bgmController.play(bgm, when);
    };
    const pause = () => {
        bgmController.pause();
    };

    patch.add('playBgm', function (bgm, startTime) {
        play(bgm, startTime);
    });
    patch.add('pauseBgm', function () {
        pause();
    });
    patch.add('resumeBgm', function () {
        bgmController.resume();
    });
    patch.add('checkBgm', function () {
        if (bgmController.playing) return;
        if (mainSetting.getValue('audio.bgmEnabled')) {
            if (bgmController.playingBgm) {
                bgmController.play(bgmController.playingBgm);
            } else {
                play(main.startBgm, 0);
            }
        } else {
            pause();
        }
    });
    patch.add('triggerBgm', function () {
        if (bgmController.playing) bgmController.pause();
        else bgmController.resume();
    });
}
