type IconIds =
    | keyof MaterialIcon['animates']
    | keyof MaterialIcon['autotile']
    | keyof MaterialIcon['enemy48']
    | keyof MaterialIcon['enemys']
    | keyof MaterialIcon['hero']
    | keyof MaterialIcon['items']
    | keyof MaterialIcon['items']
    | keyof MaterialIcon['npc48']
    | keyof MaterialIcon['npcs']
    | keyof MaterialIcon['terrains'];

interface IconOffsetInfo {
    /**
     * 图块所在额外素材的id
     */
    image: string;

    /**
     * 图块所在图片位于额外素材的横坐标
     */
    x: number;

    /**
     * 图块所在图片位于额外素材的纵坐标
     */
    y: number;
}

/**
 * 和图标相关的内容
 */
interface Icons {
    /**
     * 图标信息
     */
    readonly icons: MaterialIcon;

    /**
     * 额外素材偏移起点
     */
    readonly tilesetStartOffset: 10000;

    /**
     * 图标的id
     */
    readonly allIconIds: IconIds;

    /**
     * 获得所有图标类型
     */
    getIcons(): MaterialIcon;

    /**
     * 根据ID获得图块类型
     */
    getClsFromId<T extends AllIds>(id: T): ClsOf<T>;

    /**
     * 获得所有图标的ID
     */
    getAllIconIds(): IconIds;

    /**
     * 根据图块数字或ID获得所在的tileset和坐标信息
     * @param id 图块数字或id
     */
    getTilesetOffset(id: string | number): IconOffsetInfo | null;

    /**
     * 获取动画帧数
     * @param cls 类型
     */
    getAnimateFrames<T extends Cls>(cls: T): FrameOf<T>;
}

declare const icons: new () => Icons;
