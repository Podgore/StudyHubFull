import CreateSubjectRequest from "./models/request/Subject/CreateSubjectRequest";
import UpdateSubjectRequest from "./models/request/Subject/UpdateSubjectRequest";
import AddStudentsRequest from "./models/request/User/AddStudentsRequest";
import AssignmentResponse from "./models/response/AssignmentResponse";
import SubjectResponse from "./models/response/SubjectResponse";
import UserResponse from "./models/response/UserResponse";
import AddStudentsToSubjectResult from "./models/response/AddStudentsToSubjectResult";
import API from "./repository/Api";
import type { TeacherStudentsOverviewResponse } from "./models/response/TeacherStudentsOverviewResponse";

const Subject = {
    getSubjectsForUser: async (): Promise<SubjectResponse[] | undefined> => {
        const response = await API.get<SubjectResponse[]>(`/subject/get-subject-for-user`);
        if (response.success) {
            return response.data;
        }

        return response.error;
    },

    getSubjectWithAssignment: async (id: string | undefined): Promise<AssignmentResponse[] | undefined> => {
        const response = await API.get<AssignmentResponse[]>(`/subject/${id}/assignments`);
        if (response.success) {
            return response.data;
        }

        return response.error;
    },

    getSubject: async (id: string | undefined): Promise<SubjectResponse | undefined> => {
        const response = await API.get<SubjectResponse>(`/subject/${id}`);
        if (response.success) {
            return response.data;
        }

        return response.error;
    }, 
    getSubjectStudents: async (id: string | undefined): Promise<UserResponse[] | undefined> => {
        const response = await API.get<UserResponse[]>(`/subject/${id}/students`);
        if (response.success) {
            return response.data;
        }

        return response.error;
    },

    getTeacherStudentsOverview: async (
        subjectId: string | undefined,
    ): Promise<TeacherStudentsOverviewResponse> => {
        if (!subjectId) {
            throw new Error("Missing subject id.");
        }
        const response = await API.get<TeacherStudentsOverviewResponse>(
            `/subject/${subjectId}/students/overview`,
        );
        if (response.success && response.data != null) {
            const d = response.data as TeacherStudentsOverviewResponse & {
                Assignments?: unknown;
                Students?: unknown;
            };
            const rawAssignments = d.assignments ?? d.Assignments;
            const assignments = Array.isArray(rawAssignments) ? rawAssignments : [];
            const rawStudents = d.students ?? d.Students;
            const studentsArr = Array.isArray(rawStudents) ? rawStudents : [];
            return {
                ...d,
                assignments,
                students: studentsArr.map((s) => {
                    const row = s as TeacherStudentsOverviewResponse["students"][number] & {
                        AssignmentGrades?: unknown;
                    };
                    const rawGrades = row.assignmentGrades ?? row.AssignmentGrades;
                    return {
                        ...row,
                        assignmentGrades: Array.isArray(rawGrades) ? rawGrades : [],
                    };
                }),
            };
        }
        const code = response.statusCode ?? "?";
        throw new Error(`students/overview failed (${code})`);
    }, 

    addStudentsToSubject: async (
        data: AddStudentsRequest,
        id: string | undefined
    ): Promise<AddStudentsToSubjectResult | undefined> => {
        const response = await API.post<AddStudentsRequest, AddStudentsToSubjectResult>(
            `/subject/${id}/students`,
            data
        );
        if (response.success) {
            return response.data;
        }

        return undefined;
    }, 

    removeStudentFromSubject: async (email: string, id: string | undefined): Promise<any> => {
        try {
            const response = await API.delete(`/subject/${id}/students?studentEmail=${email}`);
              if (response.success) {
                return response.data;
            }
            return undefined;
        } catch (error) {
            console.error('Error deleting student from subject:', error);
            throw error;
        }
    },

    createSubject: async (data: CreateSubjectRequest) : Promise<any> => {
        try {
            const response = await API.post(`/subject`, data);
            return response.data;
        } catch (error) {
            console.error('Error creating subject:', error);
            throw error;
        }
    },

    updateSubject: async (
        id: string | undefined,
        data: UpdateSubjectRequest,
    ): Promise<SubjectResponse | undefined> => {
        if (!id) return undefined;
        const response = await API.put<UpdateSubjectRequest, SubjectResponse>(
            `/subject/${id}`,
            data,
        );
        if (response.success) {
            return response.data;
        }
        return undefined;
    },

    deleteSubject: async (id: string | undefined): Promise<any> => {
        try {
            const response = await API.delete<any>(`/subject/${id}`);
              if (response.success) {
                return response.data;
            }
            return undefined;
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    },
}

export default Subject;