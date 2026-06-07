import { APIRequestBase } from "../base/APIRequestBase";

export interface UpdateAssignmentRequest extends APIRequestBase {
    title: string;
    maxMark: number;
    openingDate: Date | string;
    closingDate: Date | string;
    duration: string;
    instructions?: string | null;
    lectureId?: string | null;
}
