export function getAllSavesData() {
    return new Promise<string>(res => {
        core.getAllSaves(saves => {
            if (!saves) {
                res('');
                return;
            }
            const content = {
                name: core.firstData.name,
                version: core.firstData.version,
                data: saves
            };
            // @ts-expect-error 暂时无法推导
            res(LZString.compressToBase64(JSON.stringify(content)));
        });
    });
}

export function getSaveData(index: number) {
    return new Promise<string>(res => {
        core.getSave(index, data => {
            if (!data) {
                res('');
                return;
            }
            const content = {
                name: core.firstData.name,
                version: core.firstData.version,
                data: data
            };
            // @ts-expect-error 暂时无法推导
            res(LZString.compressToBase64(JSON.stringify(content)));
        });
    });
}
