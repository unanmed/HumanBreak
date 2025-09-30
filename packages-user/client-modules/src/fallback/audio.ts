import { Patch, PatchClass } from '@motajs/legacy-common';
import { audioPlayer, bgmController, soundPlayer } from '../audio';
import { mainSetting } from '@motajs/legacy-ui';
import { sleep } from 'mutate-animate';
import { isNil } from 'lodash-es';

// todo: 添加弃用警告 logger.warn(56)

export function patchAudio() {
    const patch = new Patch(PatchClass.Control);

    const play = (bgm: BgmIds, when?: number) => {
        bgmController.play(bgm, when);
    };
    const pause = () => {
        bgmController.pause();
    };

    patch.add('playBgm', function (bgm, startTime) {
        const name = core.getMappedName(bgm) as BgmIds;
        play(name, startTime);
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

    patch.add(
        'playSound',
        function (sound, _pitch, callback, position, orientation) {
            const name = core.getMappedName(sound) as SoundIds;
            const num = soundPlayer.play(name, position, orientation);
            const route = audioPlayer.getRoute(`sounds.${num}`);
            if (!route) {
                callback?.();
                return -1;
            } else {
                sleep(route.duration).then(() => callback?.());
                return num;
            }
        }
    );
    patch.add('stopSound', function (id) {
        if (isNil(id)) {
            soundPlayer.stopAllSounds();
        } else {
            soundPlayer.stop(id);
        }
    });
    patch.add('getPlayingSounds', function () {
        return [...soundPlayer.playing];
    });
}
