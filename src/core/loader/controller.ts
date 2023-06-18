export abstract class ResourceController<D, T = D> {
    list: Record<string, T> = {};

    /**
     * 添加一个资源
     * @param uri 资源uri
     * @param data 资源数据
     */
    abstract add(uri: string, data: D): void;

    remove(uri: string) {
        delete this.list[uri];
    }
}
