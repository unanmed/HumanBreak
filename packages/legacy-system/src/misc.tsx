import { Keyboard } from '@motajs/system-action';
import KeyboardUI from './keyboard.vue';

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
