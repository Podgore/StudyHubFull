import { APIRequestBase } from "../base/APIRequestBase";

export interface UpdateLectureRequest extends APIRequestBase {
    title: string;
    description: string;
    lectureDate: string;
}
