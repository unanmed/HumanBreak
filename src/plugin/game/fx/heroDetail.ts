function drawHeroDetail(px: number, py: number) {
    if (!core.getLocalStorage('heroDetail', false)) return;
    const { hp, atk, def } = core.status.hero;
    const toDraw = {
        atk: {
            value: atk,
            color: '#FF7A7A'
        },
        def: {
            value: def,
            color: '#00E6F1'
        },
        hp: {
            value: hp,
            color: '#F9FFFF0'
        }
    };

    let i = 0;
    for (const [key, value] of Object.entries(toDraw)) {
        const ctx = core.canvas['hero'];
        core.fillBoldText(
            ctx,
            core.formatBigNumber(value.value),
            px,
            py - 10 * i,
            value.color
        );
        i++;
    }
}

export { drawHeroDetail };
