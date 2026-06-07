import { APIRequestBase } from "../base/APIRequestBase";

export interface RestoreTimedTestRequest extends APIRequestBase {
    assignmentId: string;
    sessionId: string;
    sessionHash: string;
}
