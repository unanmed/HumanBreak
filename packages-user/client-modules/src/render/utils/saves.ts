import { compressToBase64, decompressFromBase64 } from 'lz-string';
import { getConfirm, waitbox } from '../components';
import { IUIMountable } from '@motajs/system-ui';
import { SyncSaveFromServerResponse } from '@motajs/client-base';
import { CENTER_LOC, POP_BOX_WIDTH } from '../shared';

export interface SaveData {
    name: string;
    version: string;
    data: Save;
}

export interface SaveDataArray {
    name: string;
    version: string;
    data: Save[];
}

export function getSave(index: number) {
    return new Promise<SaveData | null>(res => {
        core.getSave(index, data => {
            if (!data) {
                res(null);
                return;
            }
            const content = {
                name: core.firstData.name,
                version: core.firstData.version,
                data: data instanceof Array ? data.at(-1)! : data
            };
            res(content);
        });
    });
}

export function getAllSaves() {
    return new Promise<SaveDataArray | null>(res => {
        core.getAllSaves(saves => {
            if (!saves) {
                res(null);
                return;
            }
            const content = {
                name: core.firstData.name,
                version: core.firstData.version,
                data: saves
            };
            res(content);
        });
    });
}

export async function getSaveData(index: number) {
    const data = await getSave(index);
    if (!data) return '';
    return compressToBase64(JSON.stringify(data));
}

export async function getAllSavesData() {
    const data = await getAllSaves();
    if (!data) return '';
    return compressToBase64(JSON.stringify(data));
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
            CENTER_LOC,
            POP_BOX_WIDTH
        );
    }
    const [id, password] = parseIdPassword(identifier);
    const result = await waitbox(
        controller,
        CENTER_LOC,
        POP_BOX_WIDTH,
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
            CENTER_LOC,
            POP_BOX_WIDTH
        );
    }
    if (result instanceof Array) {
        const confirm = await getConfirm(
            controller,
            '所有本地存档都将被覆盖，确认？',
            CENTER_LOC,
            POP_BOX_WIDTH,
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
                CENTER_LOC,
                POP_BOX_WIDTH
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
            CENTER_LOC,
            POP_BOX_WIDTH
        );
    }
}
