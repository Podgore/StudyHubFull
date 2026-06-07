import { APIRequestBase } from "../base/APIRequestBase";
import { LectureMaterialInputRequest } from "./LectureMaterialInputRequest";

export interface CreateLectureRequest extends APIRequestBase {
    title: string;
    description: string;
    lectureDate: string;
    materials: LectureMaterialInputRequest[];
}
