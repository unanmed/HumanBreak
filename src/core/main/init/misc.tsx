import { Keyboard } from '../custom/keyboard';
import KeyboardUI from '@/panel/keyboard.vue';

interface VirtualKeyProps {
    keyboard: Keyboard;
}

export function VirtualKey(props: VirtualKeyProps) {
    return (
        <KeyboardUI
            style="align-self: center"
            keyboard={props.keyboard}
        ></KeyboardUI>
    );
}
