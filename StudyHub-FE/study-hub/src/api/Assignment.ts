import AssignmentResponse from "./models/response/AssignmentResponse";
import API from "./repository/Api";
import { CreateAssignmentRequest } from "./models/request/Assignment/CreateAssignmentRequest";
import { UpdateAssignmentRequest } from "./models/request/Assignment/UpdateAssignmentRequest";
import { CreateAssignmentTaskRequest } from "./models/request/Variant/CreateAssignmentTask";
import { AssignmentTask } from "./models/response/AssignmentTask";
import TestTasks from "./models/response/TestTasks";
import { SendTestAnswers } from "./models/request/Assignment/SendTestAnswers";
import type { AssignmentAttachmentResponse } from "./models/response/AssignmentAttachmentResponse";
import type { HomeworkSubmissionResponse } from "./models/response/HomeworkSubmissionResponse";
import type { UpdateHomeworkSubmissionCommentRequest } from "./models/request/Assignment/UpdateHomeworkSubmissionCommentRequest";
import type { HomeworkGradingOverviewResponse } from "./models/response/HomeworkGradingOverviewResponse";
import type { HomeworkGradingDetailResponse } from "./models/response/HomeworkGradingDetailResponse";
import type { GradeHomeworkSubmissionRequest } from "./models/request/Assignment/GradeHomeworkSubmissionRequest";
import type { OpenEndedSubmissionResponse } from "./models/response/OpenEndedSubmissionResponse";
import type { SetOpenEndedMarkRequest } from "./models/request/Assignment/SetOpenEndedMarkRequest";
import type { TimedTestStatusResponse } from "./models/response/TimedTestStatusResponse";
import type TimedTestSessionResponse from "./models/response/TimedTestSessionResponse";
import type { RestoreTimedTestRequest } from "./models/request/Assignment/RestoreTimedTestRequest";
import { APIRequestBase } from "./models/request/base/APIRequestBase";
import { extractServerErrorMessage } from "../utils/apiErrorMessage";

export type TimedTestSessionLoadResult =
    | { status: "ok"; session: TimedTestSessionResponse }
    | { status: "finished" }
    | { status: "invalid-session" }
    | { status: "error" };

function apiErrorMessage(error: unknown): string {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) {
        const m = (error as { message?: unknown }).message;
        if (typeof m === "string") return m;
    }
    return "";
}

export type StudentAssignmentTestLoadResult =
    | { status: "ok"; tasks: TestTasks[] }
    | { status: "finished" }
    | { status: "error" };

async function loadStudentAssignmentTest(id: string | undefined): Promise<StudentAssignmentTestLoadResult> {
    if (!id) return { status: "error" };
    const response = await API.get<TestTasks[]>(`/variant/get-test-for-student?assignmentId=${id}`);
    if (response.success && response.data) {
        return { status: "ok", tasks: response.data };
    }
    const msg = apiErrorMessage(response.error);
    if (msg === "Test is finished" || msg.includes("Test is finished")) {
        return { status: "finished" };
    }
    console.error("Error loading test for student:", response.error);
    return { status: "error" };
}

const Assignment = {
    getNextAssignment: async (): Promise<AssignmentResponse | undefined> => {
        const response = await API.get<AssignmentResponse>(`/assignment/next-assignment`);
        if (response.success) {
            return response.data;
        }

        return response.error;
    },
    createAssignment: async (data: CreateAssignmentRequest) : Promise<any> => {
        try {
          const response = await API.post(`/assignment`, data);
          return response.data;
        } catch (error) {
          console.error('Error creating assignment:', error);
          throw error;
        }
    },

    getTimedTestStatus: async (
        assignmentId: string | undefined
    ): Promise<TimedTestStatusResponse | undefined> => {
        if (!assignmentId) return undefined;
        try {
            const response = await API.get<TimedTestStatusResponse>(
                `/assignment/${assignmentId}/timed-test-status`
            );
            if (response.success) return response.data;
            return undefined;
        } catch {
            return undefined;
        }
    },

    getAssignment: async (assignmentId: string | undefined): Promise<AssignmentResponse | undefined> => {
        try {
            const response = await API.get<AssignmentResponse>(`/assignment/${assignmentId}`);
            if (response.success) {
                return response.data;
            }
            return undefined;
        } catch (error) {
            console.error('Error loading assignment:', error);
            return undefined;
        }
    },

    deleteAssignment: async (assignmentId: string): Promise<boolean> => {
        try {
            const response = await API.delete(`/assignment/${assignmentId}`);
            return response.success && response.statusCode === 204;
        } catch (error) {
            console.error('Error deleting assignment:', error);
            return false;
        }
    },

    updateAssignment: async (
        assignmentId: string,
        data: UpdateAssignmentRequest
    ): Promise<AssignmentResponse | undefined> => {
        try {
            const response = await API.put<UpdateAssignmentRequest, AssignmentResponse>(
                `/assignment/${assignmentId}`,
                {
                    ...data,
                    openingDate: new Date(data.openingDate as string).toISOString(),
                    closingDate: new Date(data.closingDate as string).toISOString(),
                }
            );
            if (response.success) {
                return response.data;
            }
            console.error('Failed to update assignment:', response.error);
            return undefined;
        } catch (error) {
            console.error('Error updating assignment:', error);
            throw error;
        }
    },

    createAssignmentTask: async (data: CreateAssignmentTaskRequest) : Promise<any> => {
      const response = await API.post(`/assignment-task`, data);
      if (!response.success) {
        const msg = extractServerErrorMessage(response.error) ?? "Could not save test bank.";
        throw new Error(msg);
      }
      return response.data;
    },

    deleteAssignmentTask: async (id: string | undefined): Promise<any> => {
        if (!id) {
            throw new Error("Missing task id.");
        }
        const response = await API.delete<any>(`/assignment-task/${id}`);
        if (!response.success) {
            const msg = extractServerErrorMessage(response.error) ?? "Could not delete task.";
            throw new Error(msg);
        }
        return response.data;
    },

  getAssignmentVariant: async (id: string | undefined): Promise<AssignmentTask[] | undefined> => {
    try {
      const response = await API.get<AssignmentTask[]>(`/assignment-task/${id}`);
        if (response.success) {
            return response.data;
        }

        return undefined;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  updateAssignmentTask: async (task: AssignmentTask): Promise<AssignmentTask | undefined> => {
    if (!task || !task.id) {
        console.error("Task or Task ID is undefined.");
        throw new Error("Invalid task or task ID provided.");
    }

    const response = await API.put<AssignmentTask, AssignmentTask>(
        `/assignment-task/${task.id}`,
        task
    );

    if (response.success) {
        return response.data;
    }
    const msg = extractServerErrorMessage(response.error) ?? "Could not save test bank.";
    throw new Error(msg);
  },
  
  getStudentAssignmentTest: loadStudentAssignmentTest,

  getAssignmentTest: async (id: string | undefined): Promise<TestTasks[] | undefined> => {
      const result = await loadStudentAssignmentTest(id);
      return result.status === "ok" ? result.tasks : undefined;
  },

  startTimedTest: async (assignmentId: string | undefined): Promise<TimedTestSessionLoadResult> => {
    if (!assignmentId) return { status: "error" };
    const response = await API.post<APIRequestBase, TimedTestSessionResponse>(
      `/assignment/start-timed-test/${assignmentId}`,
    );
    if (response.success && response.data) {
      return { status: "ok", session: response.data };
    }
    const msg = apiErrorMessage(response.error);
    if (msg === "Test is finished" || msg.includes("Test is finished")) {
      return { status: "finished" };
    }
    return { status: "error" };
  },

  restoreTimedTest: async (
    assignmentId: string,
    sessionId: string,
    sessionHash: string,
  ): Promise<TimedTestSessionLoadResult> => {
    const response = await API.post<RestoreTimedTestRequest, TimedTestSessionResponse>(
      `/assignment/restore-timed-test`,
      {
        assignmentId,
        sessionId,
        sessionHash,
      },
    );
    if (response.success && response.data) {
      return { status: "ok", session: response.data };
    }
    const msg = apiErrorMessage(response.error);
    if (msg === "Test is finished" || msg.includes("Test is finished")) {
      return { status: "finished" };
    }
    if (
      msg.includes("Invalid or expired test session") ||
      response.statusCode === 400
    ) {
      return { status: "invalid-session" };
    }
    return { status: "error" };
  },

  getTimedTestRemainingTime: async (
    assignmentId: string,
    sessionId: string,
    sessionHash: string,
  ): Promise<string | undefined> => {
    const params = new URLSearchParams({
      sessionId,
      sessionHash,
    });
    const response = await API.get<string>(
      `/assignment/starting-test/${assignmentId}?${params.toString()}`,
    );
    if (response.success) {
      return typeof response.data === "string" ? response.data : String(response.data);
    }
    return undefined;
  },

  saveTimedTestProgress: async (data: SendTestAnswers): Promise<boolean> => {
    try {
      const response = await API.post<SendTestAnswers, unknown>(`/assignment/save-timed-test-progress`, data);
      return response.success;
    } catch (error) {
      console.error("Error saving test progress:", error);
      return false;
    }
  },

  uploadStudentAnswers: async (data: SendTestAnswers): Promise<any> => {
    try {
      const response = await API.post(`/assignment/student-answer/`, data);
        if (response.success) {
            return response.data;
        }

        return undefined;
    } catch (error) {
      console.error('Error of upload student answers:', error);
      throw error;
    }
  },

  uploadHomeworkAttachment: async (
    assignmentId: string,
    file: File
  ): Promise<AssignmentAttachmentResponse | undefined> => {
    const form = new FormData();
    form.append("file", file);
    const response = await API.postForm<AssignmentAttachmentResponse>(
      `/assignment/${assignmentId}/attachment`,
      form
    );
    if (response.success) return response.data;
    return undefined;
  },

  deleteHomeworkAttachment: async (attachmentId: string): Promise<boolean> => {
    const response = await API.delete(`/assignment/attachment/${attachmentId}`);
    return response.success && response.statusCode === 204;
  },

  getMyHomeworkSubmission: async (
    assignmentId: string
  ): Promise<HomeworkSubmissionResponse | undefined> => {
    try {
      const response = await API.get<HomeworkSubmissionResponse>(
        `/assignment/${assignmentId}/homework-submission`
      );
      if (response.success) return response.data;
      return undefined;
    } catch {
      return undefined;
    }
  },

  updateHomeworkSubmissionComment: async (
    assignmentId: string,
    data: UpdateHomeworkSubmissionCommentRequest
  ): Promise<HomeworkSubmissionResponse | undefined> => {
    try {
      const response = await API.put<
        UpdateHomeworkSubmissionCommentRequest,
        HomeworkSubmissionResponse
      >(`/assignment/${assignmentId}/homework-submission/comment`, data);
      if (response.success) return response.data;
      return undefined;
    } catch {
      return undefined;
    }
  },

  uploadStudentHomeworkAttachment: async (
    assignmentId: string,
    file: File
  ): Promise<AssignmentAttachmentResponse | undefined> => {
    const form = new FormData();
    form.append("file", file);
    const response = await API.postForm<AssignmentAttachmentResponse>(
      `/assignment/${assignmentId}/homework-submission/attachment`,
      form
    );
    if (response.success) return response.data;
    return undefined;
  },

  deleteStudentHomeworkAttachment: async (attachmentId: string): Promise<boolean> => {
    const response = await API.delete(`/assignment/homework-submission/attachment/${attachmentId}`);
    return response.success && response.statusCode === 204;
  },

  getHomeworkGradingOverview: async (
    assignmentId: string | undefined
  ): Promise<HomeworkGradingOverviewResponse | undefined> => {
    if (!assignmentId) return undefined;
    const response = await API.get<HomeworkGradingOverviewResponse>(
      `/assignment/${assignmentId}/homework-grading/overview`
    );
    if (response.success) return response.data;
    return undefined;
  },

  getHomeworkGradingDetail: async (
    assignmentId: string | undefined,
    studentId: string | undefined
  ): Promise<HomeworkGradingDetailResponse | undefined> => {
    if (!assignmentId || !studentId) return undefined;
    const response = await API.get<HomeworkGradingDetailResponse>(
      `/assignment/${assignmentId}/homework-grading/student/${studentId}`
    );
    if (response.success) return response.data;
    return undefined;
  },

  gradeHomeworkSubmission: async (
    assignmentId: string,
    studentId: string,
    data: GradeHomeworkSubmissionRequest
  ): Promise<HomeworkGradingDetailResponse | undefined> => {
    const response = await API.put<GradeHomeworkSubmissionRequest, HomeworkGradingDetailResponse>(
      `/assignment/${assignmentId}/homework-grading/student/${studentId}`,
      data
    );
    if (response.success) return response.data;
    return undefined;
  },

  getOpenEndedSubmissions: async (
    assignmentId: string | undefined
  ): Promise<OpenEndedSubmissionResponse[] | undefined> => {
    if (!assignmentId) return undefined;
    const response = await API.get<OpenEndedSubmissionResponse[]>(
      `/assignment/${assignmentId}/open-ended-submissions`
    );
    if (response.success) return response.data;
    return undefined;
  },

  setOpenEndedMark: async (data: SetOpenEndedMarkRequest): Promise<boolean> => {
    const response = await API.put<SetOpenEndedMarkRequest, unknown>(`/assignment/open-ended-mark`, {
      studentAnswerId: data.studentAnswerId,
      mark: data.mark,
      feedback: data.feedback ?? null,
    });
    return response.success === true && response.statusCode === 200;
  },
};

export default Assignment;