export default function init() {
    return {
        setGameCanvasFilter,
        getCanvasFilterByFloorId,
        setCanvasFilterByFloorId
    };
}

export function setGameCanvasFilter(filter: string) {
    ['bg', 'bg2', 'event', 'event2', 'fg', 'fg2', 'hero'].forEach(v => {
        core.canvas[v].canvas.style.filter = filter;
    });
}

export const filterMap: [FloorIds[], string][] = [];

export function getCanvasFilterByFloorId(
    floorId: FloorIds = core.status.floorId
) {
    return filterMap.find(v => v[0].includes(floorId))?.[1] ?? '';
}

export function setCanvasFilterByFloorId(
    floorId: FloorIds = core.status.floorId
) {
    setGameCanvasFilter(getCanvasFilterByFloorId(floorId));
}
