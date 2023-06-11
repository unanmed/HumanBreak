export class SoundEffect {}

class SoundController {
    add(uri: string, data: ArrayBuffer) {}
}

declare global {
    interface AncTe {
        sound: SoundController;
    }
}
ancTe.sound = new SoundController();
