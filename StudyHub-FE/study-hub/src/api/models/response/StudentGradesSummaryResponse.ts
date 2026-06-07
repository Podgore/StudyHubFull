export default interface StudentGradesSummaryResponse {
  overallAveragePercent: number | null;
  activeSubjects: number;
  completedAssignments: number;
  totalAssignments: number;
  completionRatePercent: number | null;
}
