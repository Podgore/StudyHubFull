export interface CreateAssignmentRequest {
    subjectId: string;
    title: string;
    maxMark: number;
    openingDate: Date | string;
    closingDate: Date | string;
    duration: string;
    kind: number;
    instructions?: string | null;
    lectureId?: string | null;
}