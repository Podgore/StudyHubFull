export interface HomeworkGradingStudentRowResponse {
    studentId: string;
    fullName: string;
    email: string;
    status: string;
    score?: number | null;
}

export interface HomeworkGradingOverviewResponse {
    assignmentTitle: string;
    maxMark: number;
    gradedCount: number;
    pendingCount: number;
    notSubmittedCount: number;
    students: HomeworkGradingStudentRowResponse[];
}
