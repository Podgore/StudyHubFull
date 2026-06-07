import type { APIRequestBase } from "../base/APIRequestBase";

export interface SetOpenEndedMarkRequest extends APIRequestBase {
    studentAnswerId: string;
    mark: number;
    feedback?: string | null;
}
