export default interface StudentSubjectGradeRowResponse {
  subjectId: string;
  subjectName: string;
  letterGrade: string | null;
  averagePercent: number | null;
  completedAssignments: number;
  totalAssignments: number;
}
