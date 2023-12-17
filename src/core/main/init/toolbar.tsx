import { KeyCodeUtils } from '@/plugin/keyCodes';
import type {
    CustomToolbarComponent,
    CustomToolbarProps
} from '../custom/toolbar';
import BoxAnimate from '@/components/boxAnimate.vue';
import { onUnmounted, ref } from 'vue';
import { checkAssist } from '../custom/hotkey';

interface Components {
    DefaultTool: CustomToolbarComponent;
    KeyTool: CustomToolbarComponent<'hotkey'>;
    ItemTool: CustomToolbarComponent<'item'>;
    AssistKeyTool: CustomToolbarComponent<'assistKey'>;
}

export function createToolbarComponents() {
    const com: Components = {
        DefaultTool,
        KeyTool,
        ItemTool,
        AssistKeyTool
    };
    return com;
}

function DefaultTool(props: CustomToolbarProps) {
    return <span>未知工具</span>;
}

function KeyTool(props: CustomToolbarProps<'hotkey'>) {
    const { item, toolbar } = props;
    return (
        <span onClick={() => toolbar.emitTool(item.id)}>
            {KeyCodeUtils.toString(item.key)}
        </span>
    );
}

function ItemTool(props: CustomToolbarProps<'item'>) {
    const { item, toolbar } = props;
    return (
        <div onClick={() => toolbar.emitTool(item.id)}>
            <BoxAnimate id={item.item}></BoxAnimate>
        </div>
    );
}

function AssistKeyTool(props: CustomToolbarProps<'assistKey'>) {
    const { item, toolbar } = props;
    const pressed = ref(checkAssist(toolbar.assistKey, item.assist));
    const listen = () => {
        pressed.value = checkAssist(toolbar.assistKey, item.assist);
    };
    toolbar.on('emit', listen);

    onUnmounted(() => {
        toolbar.off('emit', listen);
    });

    return (
        <span
            class="button-text"
            // @ts-ignore
            active={pressed.value}
            onClick={() => toolbar.emitTool(item.id)}
        >
            {KeyCodeUtils.toString(item.assist)}
        </span>
    );
}
