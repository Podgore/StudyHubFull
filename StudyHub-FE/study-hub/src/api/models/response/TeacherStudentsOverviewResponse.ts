export interface TeacherSubjectMetricsResponse {
    totalStudents: number;
    activeStudents: number;
    averageScorePercent: number | null;
    averageCompletionPercent: number | null;
}

export interface TeacherAssignmentColumnResponse {
    assignmentId: string;
    title: string;
    maxMark: number;
    kind: number;
}

export interface TeacherStudentAssignmentGradeResponse {
    assignmentId: string;
    status: string;
    earned: number | null;
    max: number | null;
    percent: number | null;
}

export interface TeacherStudentRowResponse {
    studentId: string;
    fullName: string;
    email: string;
    avatar: string | null;
    averagePercent: number | null;
    letterGrade: string | null;
    completedAssignments: number;
    totalAssignments: number;
    lastActivityAt: string | null;
    assignmentGrades?: TeacherStudentAssignmentGradeResponse[];
}

export interface TeacherStudentsOverviewResponse {
    metrics: TeacherSubjectMetricsResponse;
    assignments: TeacherAssignmentColumnResponse[];
    students: TeacherStudentRowResponse[];
}
