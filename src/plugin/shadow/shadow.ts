import {
    Animation,
    linear,
    PathFn,
    TimingFn,
    Transition
} from 'mutate-animate';
import { has } from '../utils';
import { Polygon } from './polygon';

interface TransitionInfo {
    time: number;
    mode: TimingFn;
}

export interface Light {
    id: string;
    x: number;
    y: number;
    r: number;
    /** 衰减开始半径 */
    decay: number;
    /** 颜色，每个值的范围0.0~1.0 */
    color: Color;
    /** 是否可以被物体遮挡 */
    noShelter?: boolean;
    /** 是否跟随勇士 */
    followHero?: boolean;
    /** 正在动画的属性 */
    _animating?: Record<string, boolean>;
    /** 执行渐变的属性 */
    _transition?: Record<string, TransitionInfo>;
    /** 表示是否是代理，只有设置渐变后才会变为true */
    _isProxy?: boolean;
    /** 跟随勇士的时候的偏移量 */
    _offset?: Loc;
}

export function init() {
    core.registerAnimationFrame('shadow', true, () => {
        if (!needRefresh) return;
        drawShadow();
    });
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let lights: Light[] = [];
let needRefresh = false;
let shadowNodes: Polygon[] = [];
let background: Color;
let blur = 3;
const temp1 = document.createElement('canvas');
const temp2 = document.createElement('canvas');
const temp3 = document.createElement('canvas');
const ct1 = temp1.getContext('2d')!;
const ct2 = temp2.getContext('2d')!;
const ct3 = temp3.getContext('2d')!;

const animationList: Record<string, Animation> = {};
const transitionList: Record<string, Transition> = {};

/**
 * 初始化阴影画布
 */
export function initShadowCanvas() {
    const w = core._PX_ ?? core.__PIXELS__;
    const h = core._PY_ ?? core.__PIXELS__;
    ctx = core.createCanvas('shadow', -32, -32, w + 64, h + 64, 55);
    canvas = ctx.canvas;
    const s = core.domStyle.scale * devicePixelRatio;
    temp1.width = (w + 64) * s;
    temp1.height = (h + 64) * s;
    temp2.width = (w + 64) * s;
    temp2.height = (h + 64) * s;
    temp3.width = (w + 64) * s;
    temp3.height = (h + 64) * s;
    ct1.scale(s, s);
    ct2.scale(s, s);
    ct3.scale(s, s);
    canvas.style.filter = `blur(${blur}px)`;
}

/**
 * 添加一个光源
 * @param info 光源信息
 */
export function addLight(info: Light) {
    lights.push(info);
    needRefresh = true;
}

/**
 * 移除一个光源
 * @param id 光源id
 */
export function removeLight(id: string) {
    const index = lights.findIndex(v => v.id === id);
    if (index === -1) {
        throw new ReferenceError(`You are going to remove nonexistent light!`);
    }
    lights.splice(index, 1);
    needRefresh = true;
}

/**
 * 设置一个光源的信息
 * @param id 光源id
 * @param info 光源信息
 */
export function setLight(id: string, info: Partial<Light>) {
    if (has(info.id)) delete info.id;
    const light = lights.find(v => v.id === id);
    if (!light) {
        throw new ReferenceError(`You are going to set nonexistent light!`);
    }
    for (const [p, v] of Object.entries(info)) {
        light[p as SelectKey<Light, number>] = v as number;
    }
    needRefresh = true;
}

/**
 * 设置当前的光源列表
 * @param list 光源列表
 */
export function setLightList(list: Light[]) {
    lights = list;
    needRefresh = true;
}

/**
 * 去除所有的光源
 */
export function removeAllLights() {
    lights = [];
    needRefresh = true;
}

/**
 * 获取一个灯光
 * @param id 灯光id
 */
export function getLight(id: string) {
    return lights.find(v => v.id === id);
}

/**
 * 获取所有灯光
 */
export function getAllLights() {
    return lights;
}

/**
 * 设置背景色
 * @param color 背景色
 */
export function setBackground(color: Color) {
    background = color;
    needRefresh = true;
}

/**
 * 刷新灯光信息并重绘
 */
export function refreshLight() {
    needRefresh = true;
}

/**
 * 动画改变一个属性的值
 * @param id 灯光id
 * @param key 动画属性，x,y,r,decay，颜色请使用animateLightColor（下个版本会加）
 * @param n 目标值
 * @param time 动画时间
 * @param mode 动画方式，渐变函数，高级动画提供了大量内置的渐变函数
 * @param relative 相对方式，是绝对还是相对
 */
export function animateLight<K extends Exclude<keyof Light, 'id'>>(
    id: string,
    key: K,
    n: Light[K],
    time: number = 1000,
    mode: TimingFn = linear(),
    relative: boolean = false
) {
    const light = getLight(id);
    if (!has(light)) {
        throw new ReferenceError(`You are going to animate nonexistent light`);
    }
    if (typeof n !== 'number') {
        light[key] = n;
    }
    const ani = animationList[id] ?? (animationList[id] = new Animation());
    if (typeof ani.value[key] !== 'number') {
        ani.register(key, light[key] as number);
    } else {
        ani.time(0)
            .mode(linear())
            .absolute()
            .apply(key, light[key] as number);
    }
    ani.time(time)
        .mode(mode)
        [relative ? 'relative' : 'absolute']()
        .apply(key, n as number);
    const start = Date.now();
    const fn = () => {
        if (Date.now() - start > time + 50) {
            ani.ticker.remove(fn);
            light._animating![key] = false;
        }
        needRefresh = true;
        light[key as SelectKey<Light, number>] = ani.value[key];
    };
    ani.ticker.add(fn);
    light._animating ??= {};
    light._animating[key] = true;
}

/**
 * 把一个属性设置为渐变模式
 * @param id 灯光id
 * @param key 渐变的属性
 * @param time 渐变时长
 * @param mode 渐变方式，渐变函数，高级动画提供了大量内置的渐变函数
 */
export function transitionLight<K extends Exclude<keyof Light, 'id'>>(
    id: string,
    key: K,
    time: number = 1000,
    mode: TimingFn = linear()
) {
    const index = lights.findIndex(v => v.id === id);
    if (index === -1) {
        throw new ReferenceError(`You are going to transite nonexistent light`);
    }
    const light = lights[index];
    if (typeof light[key] !== 'number') return;
    light._transition ??= {};
    light._transition[key] = { time, mode };
    const tran = transitionList[id] ?? (transitionList[id] = new Transition());
    tran.value[key] = light[key] as number;
    if (!light._isProxy) {
        const handler: ProxyHandler<Light> = {
            set(t, p, v) {
                if (typeof p === 'symbol') return false;
                const start = Date.now();
                if (
                    !light._transition![p] ||
                    light._animating?.[key] ||
                    typeof v !== 'number'
                ) {
                    t[p as SelectKey<Light, number>] = v;
                    return true;
                }
                // @ts-ignore
                t[p] = light[p];
                const info = light._transition![p];
                tran.mode(info.mode).time(info.time);
                const fn = () => {
                    if (Date.now() - start > info.time + 50) {
                        tran.ticker.remove(fn);
                    }
                    needRefresh = true;
                    t[p as SelectKey<Light, number>] = tran.value[key];
                };
                tran.ticker.add(fn);
                tran.transition(p, v);
                return true;
            }
        };
        lights[index] = new Proxy(light, handler);
    }
}

/**
 * 移动一个灯光
 * @param id 灯光id
 * @param x 目标横坐标
 * @param y 目标纵坐标
 * @param time 移动时间
 * @param mode 移动方式，渐变函数
 * @param relative 相对模式，相对还是绝对
 */
export function moveLight(
    id: string,
    x: number,
    y: number,
    time: number = 1000,
    mode: TimingFn = linear(),
    relative: boolean = false
) {
    animateLight(id, 'x', x, time, mode, relative);
    animateLight(id, 'y', y, time, mode, relative);
}

/**
 * 以一个路径移动光源
 * @param id 灯光id
 * @param time 移动时长
 * @param path 移动路径
 * @param mode 移动方式，渐变函数，表示移动的完成度
 * @param relative 相对模式，相对还是绝对
 */
export function moveLightAs(
    id: string,
    time: number,
    path: PathFn,
    mode: TimingFn = linear(),
    relative: boolean = true
) {
    const light = getLight(id);
    if (!has(light)) {
        throw new ReferenceError(`You are going to animate nonexistent light`);
    }
    const ani = animationList[id] ?? (animationList[id] = new Animation());
    ani.mode(linear()).time(0).move(light.x, light.y);
    ani.time(time)
        .mode(mode)
        [relative ? 'relative' : 'absolute']()
        .moveAs(path);
    const start = Date.now();
    const fn = () => {
        if (Date.now() - start > time + 50) {
            ani.ticker.remove(fn);
            light._animating!.x = false;
            light._animating!.y = false;
        }
        needRefresh = true;
        light.x = ani.x;
        light.y = ani.y;
    };
    ani.ticker.add(fn);
    light._animating ??= {};
    light._animating.x = true;
    light._animating.y = true;
}

export function animateLightColor(
    id: string,
    target: Color,
    time: number = 1000,
    mode: TimingFn = linear()
) {
    // todo
}

/**
 * 根据坐标数组设置物体节点
 * @param nodes 坐标数组
 */
export function setShadowNodes(nodes: LocArr[][]): void;
/**
 * 根据多边形数组设置物体节点
 * @param nodes 多边形数组
 */
export function setShadowNodes(nodes: Polygon[]): void;
export function setShadowNodes(nodes: LocArr[][] | Polygon[]) {
    if (nodes.length === 0) {
        shadowNodes = [];
        needRefresh = true;
    }
    if (nodes[0] instanceof Polygon) shadowNodes = nodes as Polygon[];
    else shadowNodes = Polygon.from(...(nodes as LocArr[][]));
    needRefresh = true;
}

/**
 * 根据坐标数组添加物体节点
 * @param polygons 坐标数组
 */
export function addPolygon(...polygons: LocArr[][]): void;
/**
 * 根据多边形数组添加物体节点
 * @param polygons 多边形数组
 */
export function addPolygon(...polygons: Polygon[]): void;
export function addPolygon(...polygons: Polygon[] | LocArr[][]) {
    if (polygons.length === 0) return;
    if (polygons[0] instanceof Polygon)
        shadowNodes.push(...(polygons as Polygon[]));
    else shadowNodes.push(...Polygon.from(...(polygons as LocArr[][])));
    needRefresh = true;
}

/**
 * 设置光源的虚化程度
 * @param n 虚化程度
 */
export function setBlur(n: number) {
    blur = n;
    canvas.style.filter = `blur(${n}px)`;
}

/**
 * 绘制阴影
 */
export function drawShadow() {
    const w = (core._PX_ ?? core.__PIXELS__) + 64;
    const h = (core._PY_ ?? core.__PIXELS__) + 64;
    needRefresh = false;
    ctx.clearRect(0, 0, w, h);
    ct1.clearRect(0, 0, w, h);
    ct2.clearRect(0, 0, w, h);
    ct3.clearRect(0, 0, w, h);

    const b = core.arrayToRGBA(background);
    ctx.globalCompositeOperation = 'source-over';
    ct3.globalCompositeOperation = 'source-over';

    // 绘制阴影，一个光源一个光源地绘制，然后source-out获得光，然后把光叠加，再source-out获得最终阴影
    for (let i = 0; i < lights.length; i++) {
        const { x, y, r, decay, color, noShelter } = lights[i];
        const rx = x + 32;
        const ry = y + 32;
        // 绘制阴影
        ct1.clearRect(0, 0, w, h);
        ct2.clearRect(0, 0, w, h);
        if (!noShelter) {
            for (const polygon of shadowNodes) {
                const area = polygon.shadowArea(rx, ry, r);
                area.forEach(v => {
                    ct1.beginPath();
                    ct1.moveTo(v[0][0], v[0][1]);
                    for (let i = 1; i < v.length; i++) {
                        ct1.lineTo(v[i][0], v[i][1]);
                    }
                    ct1.closePath();
                    ct1.fillStyle = '#000';
                    ct1.globalCompositeOperation = 'source-over';
                    ct1.fill();
                });
            }
        }
        // 存入ct2，用于绘制真实阴影
        ct2.globalCompositeOperation = 'source-over';
        ct2.drawImage(temp1, 0, 0, w, h);
        ct2.globalCompositeOperation = 'source-out';
        const gra = ct2.createRadialGradient(rx, ry, decay, rx, ry, r);
        gra.addColorStop(0, core.arrayToRGBA(color));
        gra.addColorStop(1, 'transparent');
        ct2.fillStyle = gra;
        ct2.beginPath();
        ct2.arc(rx, ry, r, 0, Math.PI * 2);
        ct2.fill();
        ctx.drawImage(temp2, 0, 0, w, h);
        // 再绘制ct1的阴影，然后绘制到ct3叠加
        ct1.globalCompositeOperation = 'source-out';
        const gra2 = ct1.createRadialGradient(rx, ry, decay, rx, ry, r);
        gra2.addColorStop(0, '#fff');
        gra2.addColorStop(1, '#fff0');
        ct1.beginPath();
        ct1.arc(rx, ry, r, 0, Math.PI * 2);
        ct1.fillStyle = gra2;
        ct1.fill();
        // 绘制到ct3上
        ct3.drawImage(temp1, 0, 0, w, h);
    }
    // 绘制真实阴影
    ct3.globalCompositeOperation = 'source-out';
    ct3.fillStyle = b;
    ct3.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(temp3, 0, 0, w, h);
}
