export default interface StudentAssignmentGradeRowResponse {
  assignmentId: string;
  title: string;
  kind: number;
  typeLabel: string;
  dueAt: string;
  submittedAt: string | null;
  scorePercent: number | null;
  pointsEarned: number | null;
  maxPoints: number;
  teacherFeedback?: string | null;
}
