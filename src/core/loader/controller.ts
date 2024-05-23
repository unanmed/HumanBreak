import { EventEmitter } from '../common/eventEmitter';

interface ResourceControllerEvent<D = any, T = D> {
    add: (uri: string, data: D) => void;
    delete: (uri: string, content: T) => void;
}

export abstract class ResourceController<
    D,
    T = D
> extends EventEmitter<ResourceControllerEvent> {
    list: Record<string, T> = {};

    /**
     * 添加一个资源
     * @param uri 资源uri
     * @param data 资源数据
     */
    abstract add(uri: string, data: D): void;

    /**
     * 删除一个资源
     * @param uri 要删除的资源的uri
     */
    remove(uri: string) {
        const content = this.list[uri];
        delete this.list[uri];
        // this.emit(uri, content);
    }
}
