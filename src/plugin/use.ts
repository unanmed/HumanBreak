export default function init() {
    return { useDrag, useWheel };
}

/**
 * 向一个元素添加拖拽事件
 * @param ele 目标元素
 * @param fn 推拽时触发的函数，传入x y和鼠标事件或点击事件
 * @param ondown 鼠标按下时执行的函数
 * @param global 是否全局拖拽，即拖拽后鼠标或手指离开元素后是否依然视为正在拖拽
 */
export function useDrag(
    ele: HTMLElement,
    fn: (x: number, y: number, e: MouseEvent | TouchEvent) => void,
    ondown?: (x: number, y: number, e: MouseEvent | TouchEvent) => void,
    global: boolean = false
) {
    let down = false;
    ele.addEventListener('mousedown', e => {
        down = true;
        if (ondown) ondown(e.clientX, e.clientY, e);
    });
    ele.addEventListener('touchstart', e => {
        down = true;
        if (ondown) ondown(e.touches[0].clientX, e.touches[0].clientY, e);
    });

    document.addEventListener('mouseup', () => (down = false));
    document.addEventListener('touchend', () => (down = false));

    const target = global ? document : ele;

    target.addEventListener('mousemove', e => {
        if (!down) return;
        const ee = e as MouseEvent;
        fn(ee.clientX, ee.clientY, ee);
    });
    target.addEventListener('touchmove', e => {
        if (!down) return;
        const ee = e as TouchEvent;
        fn(ee.touches[0].clientX, ee.touches[0].clientY, ee);
    });
}

/**
 * 当触发滚轮时执行函数
 * @param ele 目标元素
 * @param fn 当滚轮触发时执行的函数
 */
export function useWheel(
    ele: HTMLElement,
    fn: (x: number, y: number, z: number, e: WheelEvent) => void
): void {
    ele.addEventListener('wheel', e => {
        fn(e.deltaX, e.deltaY, e.deltaZ, e);
    });
}
