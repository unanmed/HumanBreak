import { StreamLoader } from '../loader';
import { audioPlayer, AudioRoute } from './player';
import { AudioType, guessTypeByExt } from './support';

export function loadAllBgm() {
    const loading = Mota.require('var', 'loading');
    loading.once('coreInit', () => {
        const data = data_a1e2fb4a_e986_4524_b0da_9b7ba7c0874d;
        for (const bgm of data.main.bgms) {
            const type = guessTypeByExt(bgm);

            if (type === AudioType.Opus || type === AudioType.Ogg) {
                const source = audioPlayer.createStreamSource();
                const stream = new StreamLoader(`project/bgms/${bgm}`);
                stream.pipe(source);
                source.setLoop(true);
                const route = new AudioRoute(source, audioPlayer);
                audioPlayer.addRoute(`bgms.${bgm}`, route);
            } else {
                const source = audioPlayer.createElementSource();
                source.setSource(`project/bgms/${bgm}`);
                source.setLoop(true);
                const route = new AudioRoute(source, audioPlayer);
                audioPlayer.addRoute(`bgms.${bgm}`, route);
            }
        }
    });
}
