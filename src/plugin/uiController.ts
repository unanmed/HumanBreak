import { Component, markRaw, ref, Ref, watch } from 'vue';
import Book from '../ui/book.vue';
import BookDetail from '../ui/bookDetail.vue';

export const bookOpened = ref(false);
export const bookDetail = ref(false);

let app: HTMLDivElement;

/** ui声明列表 */
const UI_LIST: [Ref<boolean>, Component][] = [
    [bookOpened, Book],
    [bookDetail, BookDetail]
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
                uiStack.value.splice(index);
                if (uiStack.value.length === 0) {
                    hideApp();
                }
            }
        });
    });
    return { uiStack, bookDetail, bookOpened };
}

function showApp() {
    app.style.display = 'flex';
    core.lockControl();
}

function hideApp() {
    app.style.display = 'none';
    core.unlockControl();
}
