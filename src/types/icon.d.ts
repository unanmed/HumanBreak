/** 和图标相关的函数 */
declare class icons {
    /** 获得所有图标类型 */
    getIcons(): void;

    /** 根据ID获得其类型 */
    getClsFromId(id?: string): BlockCls;

    /** 获得所有图标的ID */
    getAllIconIds(): void;

    /** 根据图块数字或ID获得所在的tileset和坐标信息 */
    getTilesetOffset(id?: string): void;

    /**
     * 获取图块的帧数
     * @param cls 图块类型
     */
    getAnimateFrames(cls: BlockCls): 1 | 2 | 4;
}
