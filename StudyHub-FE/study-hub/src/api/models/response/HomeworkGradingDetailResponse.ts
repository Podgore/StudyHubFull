import type { AssignmentAttachmentResponse } from "./AssignmentAttachmentResponse";

export interface HomeworkGradingDetailResponse {
    studentId: string;
    fullName: string;
    email: string;
    studentComment?: string | null;
    updatedAt?: string | null;
    attachments: AssignmentAttachmentResponse[];
    teacherScore?: number | null;
    teacherFeedback?: string | null;
    maxMark: number;
    status: string;
}
