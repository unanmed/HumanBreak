export function chaseInit1() {
    const ids: FloorIds[] = ['MT13', 'MT14', 'MT15'];
    const toRemove: [number, number, FloorIds][] = [];
    ids.forEach(v => {
        core.status.maps[v].cannotMoveDirectly = true;
        core.extractBlocks(v);
        core.status.maps[v].blocks.forEach(vv => {
            if (
                ['animates', 'items'].includes(vv.event.cls) &&
                !vv.event.id.endsWith('Portal')
            ) {
                toRemove.push([vv.x, vv.y, v]);
            }
        });
    });
    toRemove.forEach(v => {
        core.removeBlock(...v);
    });
}
