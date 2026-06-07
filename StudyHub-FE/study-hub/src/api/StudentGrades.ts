import API from './repository/Api';
import StudentGradesSummaryResponse from './models/response/StudentGradesSummaryResponse';
import StudentSubjectGradeRowResponse from './models/response/StudentSubjectGradeRowResponse';
import StudentAssignmentGradeRowResponse from './models/response/StudentAssignmentGradeRowResponse';

const StudentGrades = {
  getSummary: async (): Promise<StudentGradesSummaryResponse | undefined> => {
    const response = await API.get<StudentGradesSummaryResponse>('/student-grades/summary');
    return response.success ? response.data : undefined;
  },

  getSubjects: async (): Promise<StudentSubjectGradeRowResponse[] | undefined> => {
    const response = await API.get<StudentSubjectGradeRowResponse[]>('/student-grades/subjects');
    return response.success ? response.data : undefined;
  },

  getAssignmentsForSubject: async (
    subjectId: string,
  ): Promise<StudentAssignmentGradeRowResponse[] | undefined> => {
    const response = await API.get<StudentAssignmentGradeRowResponse[]>(
      `/student-grades/subjects/${subjectId}/assignments`,
    );
    return response.success ? response.data : undefined;
  },
};

export default StudentGrades;
