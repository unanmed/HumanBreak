export const enum FaceDirection {
    Unknown,
    Left,
    Up,
    Right,
    Down,
    LeftUp,
    RightUp,
    LeftDown,
    RightDown
}

export interface IFaceData {
    /** 图块数字 */
    readonly identifier: number;
    /** 图块朝向 */
    readonly face: FaceDirection;
}

export interface IRoleFaceBinder {
    /**
     * 给指定的图块分配朝向绑定
     * @param identifier 图块数字
     * @param main 主图块朝向，一般是朝下
     */
    malloc(identifier: number, main: FaceDirection): void;

    /**
     * 将一个图块与另一个图块绑定朝向，需要注意要先调用 {@link malloc} 分配朝向信息
     * @param identifier 当前图块数字
     * @param main 主图块数字，即当前图块与目标图块属于主图块的另一个朝向
     * @param face 当前图块的朝向方向
     */
    bind(identifier: number, main: number, face: FaceDirection): void;

    /**
     * 获取一个图块指定朝向的图块数字
     * @param identifier 图块数字，可以是任意朝向的图块数字
     * @param face 要获取的朝向
     */
    getFaceOf(identifier: number, face: FaceDirection): IFaceData | null;

    /**
     * 获取指定图块数字是哪个朝向
     * @param identifier 图块数字
     */
    getFaceDirection(identifier: number): FaceDirection | undefined;

    /**
     * 获取指定图块数字绑定至的主朝向
     * @param identifier 图块数字，可以是任意朝向的图块数字
     */
    getMainFace(identifier: number): IFaceData | null;
}
