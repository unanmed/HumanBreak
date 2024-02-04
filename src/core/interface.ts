export interface Undoable<T> {
    stack: T[];
    redoStack: T[];

    /**
     * 撤销
     */
    undo(): T | undefined;

    /**
     * 重做
     */
    redo(): T | undefined;
}
