import { APIRequestBase } from "../base/APIRequestBase";

export interface UpdateHomeworkSubmissionCommentRequest extends APIRequestBase {
    studentComment?: string | null;
}
