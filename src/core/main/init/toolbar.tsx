import { KeyCodeUtils } from '@/plugin/keyCodes';
import type {
    CustomToolbarComponent,
    CustomToolbarProps
} from '../custom/toolbar';
import BoxAnimate from '@/components/boxAnimate.vue';
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
        <span class="button-text" onClick={() => toolbar.emitTool(item.id)}>
            {KeyCodeUtils.toString(item.key)}
        </span>
    );
}

function ItemTool(props: CustomToolbarProps<'item'>) {
    const { item, toolbar } = props;
    return (
        <div
            style="display: flex; justify-content: center; width: 50px"
            onClick={() => toolbar.emitTool(item.id)}
        >
            <BoxAnimate
                noborder={true}
                width={50}
                height={50}
                id={item.item}
            ></BoxAnimate>
        </div>
    );
}

function AssistKeyTool(props: CustomToolbarProps<'assistKey'>) {
    const { item, toolbar } = props;
    const pressed = checkAssist(toolbar.assistKey, item.assist);

    return (
        <span
            class="button-text"
            // @ts-ignore
            active={pressed}
            onClick={() => toolbar.emitTool(item.id).refresh()}
        >
            {KeyCodeUtils.toString(item.assist)}
        </span>
    );
}
