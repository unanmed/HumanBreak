import { Undoable } from '@/core/interface';
import { EventEmitter } from 'eventemitter3';
import { logger } from '@/core/common/logger';

type ToJSONFunction<T> = (data: T) => string;
type FromJSONFunction<T> = (data: string) => T;

export class GameState {
    state: Map<string, any> = new Map();

    private static states: Set<string> = new Set();
    private static toJSONFn: Map<string, ToJSONFunction<any>> = new Map();
    private static fromJSONFn: Map<string, FromJSONFunction<any>> = new Map();

    /**
     * 序列化游戏状态，可直接用于存储等操作
     */
    toJSON() {
        const obj: Record<string, string> = {};
        this.state.forEach((v, k) => {
            const to = GameState.toJSONFn.get(k);
            if (to) obj[k] = to(v);
            else obj[k] = JSON.stringify(v);
        });
        return JSON.stringify(obj);
    }

    /**
     * 获取某个游戏状态
     * @param key 要获取的状态名称
     */
    get<T>(key: string): T | undefined {
        return this.state.get(key);
    }

    /**
     * 设置某个游戏状态
     * @param key 要设置的状态名称
     * @param data 状态数据
     */
    set(key: string, data: any) {
        this.state.set(key, data);
    }

    /**
     * 注册一个新的状态，如果重复则会覆盖
     * @param key 状态名称
     * @param toJSON 状态的序列化函数，传入状态数据，要求返回序列化后的字符串，
     *               不填则表示使用JSON.stringify进行序列化
     * @param fromJSON 状态的反序列化函数，传入序列化后的字符串，要求返回反序列化的状态数据，
     *                 不填表示使用JSON.parse进行反序列化
     */
    static register<T>(
        key: string,
        toJSON?: ToJSONFunction<T>,
        fromJSON?: FromJSONFunction<T>
    ) {
        if (this.states.has(key)) {
            logger.warn(16, key);
        }

        if (toJSON) {
            this.toJSONFn.set(key, toJSON);
        } else {
            this.toJSONFn.delete(key);
        }
        if (fromJSON) {
            this.fromJSONFn.set(key, fromJSON);
        } else {
            this.fromJSONFn.delete(key);
        }
    }

    /**
     * 从序列化字符串读取游戏状态
     * @param json 序列化字符串
     */
    static fromJSON(json: string) {
        const obj: Record<string, string> = JSON.parse(json);
        const state = new GameState();
        for (const [key, data] of Object.entries(obj)) {
            const from = this.fromJSONFn.get(key);
            if (from) state.set(key, from(data));
            else state.set(key, JSON.parse(data));
        }
        return state;
    }
}

interface StateStoreEvent {
    undo: [state: GameState];
    redo: [state: GameState];
    change: [before: GameState | undefined, now: GameState];
}

class StateStore
    extends EventEmitter<StateStoreEvent>
    implements Undoable<GameState>
{
    now?: GameState;
    stack: GameState[] = [];
    redoStack: GameState[] = [];

    undo(): GameState | undefined {
        const state = this.stack.pop();
        if (!state) return void 0;
        this.redoStack.push(state);
        this.emit('undo', state);
        return state;
    }

    redo(): GameState | undefined {
        const state = this.redoStack.pop();
        if (!state) return void 0;
        this.stack.push(state);
        this.emit('redo', state);
        return state;
    }

    use(state: GameState) {
        const before = this.now;
        this.now = state;
        this.emit('change', before, state);
    }
}

export const gameStates = new StateStore();
