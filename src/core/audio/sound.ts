export class MotaAudio {}

class SoundController {
    add(uri: string, data: ArrayBuffer) {}
}

declare global {
    interface AncTe {
        sound: SoundController;
    }
}
ancTe.sound = new SoundController();
