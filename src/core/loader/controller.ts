export abstract class ResourceController<D, T = D> {
    list: Record<string, T> = {};

    abstract add(uri: string, data: D): void;

    remove(uri: string) {
        delete this.list[uri];
    }
}
