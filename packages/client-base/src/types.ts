export interface ResponseBase {
    code: number;
    message: string;
}

export interface SyncSaveFromServerResponse extends ResponseBase {
    msg: string;
}
