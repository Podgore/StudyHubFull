export interface OpenEndedSubmissionResponse {
    studentAnswerId: string;
    studentId: string;
    studentFullName: string;
    studentEmail: string;
    taskVariantId: string;
    assignmentTaskId: string;
    questionLabel: string;
    studentResponse?: string | null;
    referenceHint?: string | null;
    maxMark: number;
    awardedMark: number;
    reviewedByTeacher: boolean;
    teacherFeedback?: string | null;
}
