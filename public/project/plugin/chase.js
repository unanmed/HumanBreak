export function chaseInit1() {
    const ids = ['MT13', 'MT14', 'MT15'];
    const toRemove = [];
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

core.plugin.chase = {
    chaseInit1
};
