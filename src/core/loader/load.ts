import axios, { AxiosRequestConfig } from 'axios';

class LoadTask<T> {
    loaded: boolean = false;
    promise?: Promise<T>;
    url: string;
    config?: AxiosRequestConfig<T>;

    constructor(url: string, config?: AxiosRequestConfig<T>) {
        this.url = url;
        this.config = config;
    }

    load() {
        if (this.promise) return this.promise;

        return (this.promise = axios.get(this.url, this.config));
    }

    static list: Promise<any>[] = [];
    static push(...tasks: LoadTask<any>[]) {
        this.list.push(...tasks.map(v => v.load()));
    }

    static onEnd<T extends any[] = any[]>(): Promise<T> {
        return Promise.all(LoadTask.list) as Promise<T>;
    }
}

export default function load() {}
