import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { getConfirm, waitbox } from '../render';
import { IUIMountable } from '@motajs/system-ui';
import { SyncSaveFromServerResponse } from '@motajs/client-base';

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
            res(compressToBase64(JSON.stringify(content)));
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
            res(compressToBase64(JSON.stringify(content)));
        });
    });
}

//#region 服务器加载

const enum FromServerResponse {
    Success,
    ErrorCannotParse,
    ErrorCannotSync,
    ErrorUnexpectedCode
}

function parseIdPassword(id: string): [string, string] {
    if (id.length === 7) return [id.slice(0, 4), id.slice(4)];
    else return [id.slice(0, 6), id.slice(6)];
}

async function parseResponse(response: SyncSaveFromServerResponse) {
    let msg: Save | Save[] | null = null;
    try {
        msg = JSON.parse(decompressFromBase64(response.msg));
    } catch {
        // 无视报错
    }
    if (!msg) {
        try {
            msg = JSON.parse(response.msg);
        } catch {
            // 无视报错
        }
    }
    if (msg) {
        return msg;
    } else {
        return FromServerResponse.ErrorCannotParse;
    }
}

async function syncLoad(id: string, password: string) {
    const formData = new FormData();
    formData.append('type', 'load');
    formData.append('name', core.firstData.name);
    formData.append('id', id);
    formData.append('password', password);

    try {
        const response = await fetch('/games/sync.php', {
            method: 'POST',
            body: formData
        });

        const data = (await response.json()) as SyncSaveFromServerResponse;
        if (data.code === 0) {
            return parseResponse(data);
        } else {
            return FromServerResponse.ErrorUnexpectedCode;
        }
    } catch {
        return FromServerResponse.ErrorCannotSync;
    }
}

export async function syncFromServer(
    controller: IUIMountable,
    identifier: string
): Promise<void> {
    if (!/^\d{6}\w{4}$/.test(identifier) && !/^\d{4}\w{3}$/.test(identifier)) {
        return void getConfirm(
            controller,
            '不合法的存档编号+密码！请检查格式！',
            [240, 240, void 0, void 0, 0.5, 0.5],
            240
        );
    }
    const [id, password] = parseIdPassword(identifier);
    const result = await waitbox(
        controller,
        [240, 240, void 0, void 0, 0.5, 0.5],
        240,
        syncLoad(id, password)
    );
    if (typeof result === 'number') {
        const map = {
            [FromServerResponse.ErrorCannotParse]: '出错啦！\n存档解析失败',
            [FromServerResponse.ErrorCannotSync]:
                '出错啦！\n无法从服务器同步存档。',
            [FromServerResponse.ErrorUnexpectedCode]:
                '出错啦！\n无法从服务器同步存档。'
        };
        return void getConfirm(
            controller,
            map[result],
            [240, 240, void 0, void 0, 0.5, 0.5],
            240
        );
    }
    if (result instanceof Array) {
        const confirm = await getConfirm(
            controller,
            '所有本地存档都将被覆盖，确认？',
            [240, 240, void 0, void 0, 0.5, 0.5],
            240,
            {
                defaultYes: true
            }
        );
        if (confirm) {
            const max = 5 * (main.savePages || 30);
            for (let i = 1; i <= max; i++) {
                if (i <= result.length) {
                    core.setLocalForage('save' + i, result[i - 1]);
                } else if (core.saves.ids[i]) {
                    core.removeLocalForage('save' + i);
                }
            }
            return void getConfirm(
                controller,
                '同步成功！\n你的本地所有存档均已被覆盖。',
                [240, 240, void 0, void 0, 0.5, 0.5],
                240
            );
        }
    } else {
        const idx = core.saves.saveIndex;
        await new Promise<void>(res => {
            core.setLocalForage(`save${idx}`, result, res);
        });
        return void getConfirm(
            controller,
            `同步成功！\n单存档已覆盖至存档 ${idx}`,
            [240, 240, void 0, void 0, 0.5, 0.5],
            240
        );
    }
}
