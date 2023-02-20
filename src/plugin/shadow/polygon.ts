export class Polygon {
    /**
     * 多边形的节点
     */
    nodes: LocArr[];

    private cache: Record<string, LocArr[][]> = {};

    static from(...polygons: LocArr[][]) {
        return polygons.map(v => new Polygon(v));
    }

    constructor(nodes: LocArr[]) {
        if (nodes.length < 3) {
            throw new Error(`Nodes number delivered is less than 3!`);
        }
        this.nodes = nodes.map(v => [v[0] + 32, v[1] + 32]);
    }

    /**
     * 获取一个点光源下的阴影
     */
    shadowArea(x: number, y: number, r: number): LocArr[][] {
        const id = `${x},${y}`;
        if (this.cache[id]) return this.cache[id];
        const res: LocArr[][] = [];
        const w = (core._PX_ ?? core.__PIXELS__) + 64;
        const h = (core._PY_ ?? core.__PIXELS__) + 64;

        const aspect = h / w;

        const intersect = (nx: number, ny: number): LocArr => {
            const k = (ny - y) / (nx - x);
            if (k > aspect || k < -aspect) {
                if (ny < y) {
                    const ix = x + y / k;
                    return [2 * x - ix, 0];
                } else {
                    const ix = x + (h - y) / k;
                    return [ix, h];
                }
            } else {
                if (nx < x) {
                    const iy = y + k * x;
                    return [0, 2 * y - iy];
                } else {
                    const iy = y + k * (w - x);
                    return [w, iy];
                }
            }
        };
        const l = this.nodes.length;
        let now = intersect(...this.nodes[0]);
        for (let i = 0; i < l; i++) {
            const next = (i + 1) % l;
            const nextInter = intersect(...this.nodes[next]);
            const start = [this.nodes[i], now];
            const end = [nextInter, this.nodes[next]];
            let path: LocArr[];
            if (
                (now[0] === 0 && nextInter[1] === 0) ||
                (now[1] === 0 && nextInter[0] === 0)
            ) {
                path = [...start, [0, 0], ...end];
            } else if (
                (now[0] === 0 && nextInter[1] === h) ||
                (now[1] === h && nextInter[0] === 0)
            ) {
                path = [...start, [0, h], ...end];
            } else if (
                (now[0] === w && nextInter[1] === 0) ||
                (now[1] === 0 && nextInter[0] === w)
            ) {
                path = [...start, [w, 0], ...end];
            } else if (
                (now[0] === w && nextInter[1] === h) ||
                (now[1] === h && nextInter[0] === w)
            ) {
                path = [...start, [w, h], ...end];
            } else {
                path = [...start, ...end];
            }
            res.push(path);
            now = nextInter;
        }

        this.cache[id] = res;

        return res;
    }
}
