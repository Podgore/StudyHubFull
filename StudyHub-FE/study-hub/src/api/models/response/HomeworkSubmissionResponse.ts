import type { AssignmentAttachmentResponse } from "./AssignmentAttachmentResponse";

export interface HomeworkSubmissionResponse {
    id?: string | null;
    studentComment?: string | null;
    updatedAt?: string | null;
    canEdit: boolean;
    teacherScore?: number | null;
    teacherFeedback?: string | null;
    attachments: AssignmentAttachmentResponse[];
}
