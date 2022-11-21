import { sleep } from 'mutate-animate';
import { Component, markRaw, ref, Ref, watch } from 'vue';
import Book from '../ui/book.vue';
import Toolbox from '../ui/toolbox.vue';

export const bookOpened = ref(false);
export const toolOpened = ref(false);

export const transition = ref(true);

let app: HTMLDivElement;

/** ui声明列表 */
const UI_LIST: [Ref<boolean>, Component][] = [
    [bookOpened, Book],
    [toolOpened, Toolbox]
];

/** ui栈 */
export const uiStack = ref<Component[]>([]);

export default function init() {
    app = document.getElementById('root') as HTMLDivElement;
    UI_LIST.forEach(([ref, com]) => {
        watch(ref, n => {
            if (n === true) {
                uiStack.value.push(markRaw(com));
                showApp();
            } else {
                const index = uiStack.value.findIndex(v => v === com);
                if (uiStack.value.length === 1) {
                    hideApp(index);
                } else {
                    uiStack.value.splice(index, 1);
                }
            }
        });
    });
    return { uiStack, bookOpened, toolOpened, transition };
}

async function showApp() {
    core.lockControl();
    if (transition.value) {
        app.style.transition = 'all 0.6s linear';
    } else {
        app.style.transition = '';
    }
    app.style.display = 'flex';
    await sleep(50);
    app.style.opacity = '1';
}

async function hideApp(index: number) {
    if (transition.value) {
        app.style.transition = 'all 0.6s linear';
        app.style.opacity = '0';
        await sleep(600);
        uiStack.value.splice(index, 1);
        app.style.display = 'none';
        core.closePanel();
    } else {
        app.style.transition = '';
        app.style.opacity = '0';
        uiStack.value.splice(index, 1);
        app.style.display = 'none';
        core.closePanel();
    }
}
