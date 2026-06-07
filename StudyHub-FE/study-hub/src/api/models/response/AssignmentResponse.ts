import type { AssignmentAttachmentResponse } from "./AssignmentAttachmentResponse";

export const AssignmentKind = {
    TimedTest: 0,
    Homework: 1,
} as const;

interface AssignmentResponse {
    id: string;
    subjectId: string;
    title: string;
    maxMark: number;
    openingDate: string | Date;
    closingDate: string | Date;
    duration: string | Date;
    kind: number;
    instructions?: string | null;
    lectureId?: string | null;
    lectureTitle?: string | null;
    attachments?: AssignmentAttachmentResponse[];
}

export default AssignmentResponse;
