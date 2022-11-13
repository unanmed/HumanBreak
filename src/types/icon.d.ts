/** 和图标相关的函数 */
declare class icons {
    /** 获得所有图标类型 */
    getIcons(): void;

    /** 根据ID获得其类型 */
    getClsFromId(id?: string): string;

    /** 获得所有图标的ID */
    getAllIconIds(): void;

    /** 根据图块数字或ID获得所在的tileset和坐标信息 */
    getTilesetOffset(id?: string): void;
}
