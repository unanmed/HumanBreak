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

export interface ResponseBase {
    code: number;
    message: string;
}

export type CSSObj = Partial<Record<CanParseCss, string>>;
