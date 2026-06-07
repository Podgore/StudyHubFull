import type { APIRequestBase } from "../base/APIRequestBase";

export interface GradeHomeworkSubmissionRequest extends APIRequestBase {
    score: number;
    teacherFeedback?: string | null;
}
