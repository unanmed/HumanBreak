import { Ref, ref, watch } from 'vue';
import { nextFrame } from '../utils';

interface ChangableValue<T> {
    change: Ref<boolean>;
    value: Ref<T>;
    stop: () => void;
}

/**
 * 创建一个监听响应式变量更改的，可以用于Changable的监听器
 * @param value 要监听的值
 */
export function createChangable<T>(
    value: Ref<T>,
    key?: keyof T
): ChangableValue<T> {
    const change = ref(false);
    const stop = watch(value, (n, o) => {
        if (key) {
            if (n[key] === o[key]) return;
        }
        if (change.value) {
            change.value = false;
            nextFrame(() => (change.value = true));
        } else {
            change.value = true;
        }
    });

    return {
        change,
        value,
        stop
    };
}
