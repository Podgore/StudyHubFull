import API, { API_ORIGIN } from "./repository/Api";
import type { AddLectureFileMaterialRequest } from "./models/request/Lecture/AddLectureFileMaterialRequest";
import type { AddLectureVideoMaterialRequest } from "./models/request/Lecture/AddLectureVideoMaterialRequest";
import type { CreateLectureRequest } from "./models/request/Lecture/CreateLectureRequest";
import type { LectureMaterialInputRequest } from "./models/request/Lecture/LectureMaterialInputRequest";
import type { UpdateLectureRequest } from "./models/request/Lecture/UpdateLectureRequest";
import type { LectureResponse } from "./models/response/LectureResponse";
import type { LectureMaterialResponse } from "./models/response/LectureMaterialResponse";

const Lecture = {
    getById: async (lectureId: string | undefined): Promise<LectureResponse | undefined> => {
        const response = await API.get<LectureResponse>(`/lecture/${lectureId}`);
        if (response.success) return response.data;
        return undefined;
    },

    getLecturesBySubject: async (subjectId: string | undefined): Promise<LectureResponse[] | undefined> => {
        const response = await API.get<LectureResponse[]>(`/subject/${subjectId}/lectures`);
        if (response.success) return response.data;
        return undefined;
    },

    create: async (subjectId: string | undefined, body: CreateLectureRequest): Promise<LectureResponse | undefined> => {
        const response = await API.post<CreateLectureRequest, LectureResponse>(`/subject/${subjectId}/lectures`, body);
        if (response.success) return response.data;
        return undefined;
    },

    update: async (lectureId: string, body: UpdateLectureRequest): Promise<LectureResponse | undefined> => {
        const response = await API.put<UpdateLectureRequest, LectureResponse>(`/lecture/${lectureId}`, body);
        if (response.success) return response.data;
        return undefined;
    },

    delete: async (lectureId: string): Promise<boolean> => {
        const response = await API.delete(`/lecture/${lectureId}`);
        return response.success && response.statusCode === 204;
    },

    addMaterial: async (
        lectureId: string,
        body: LectureMaterialInputRequest
    ): Promise<LectureMaterialResponse | undefined> => {
        const response = await API.post<LectureMaterialInputRequest, LectureMaterialResponse>(
            `/lecture/${lectureId}/materials`,
            body
        );
        if (response.success) return response.data;
        return undefined;
    },

    addFileMaterial: async (
        lectureId: string,
        request: AddLectureFileMaterialRequest
    ): Promise<LectureMaterialResponse | undefined> => {
        const form = new FormData();
        form.append("title", request.title);
        form.append("orderIndex", String(request.orderIndex));
        form.append("isVisible", String(request.isVisible));
        if (request.description) form.append("description", request.description);
        form.append("file", request.file);
        const response = await API.postForm<LectureMaterialResponse>(`/lecture/${lectureId}/materials/file`, form);
        if (response.success) return response.data;
        return undefined;
    },

    addUploadedVideoMaterial: async (
        lectureId: string,
        request: AddLectureVideoMaterialRequest
    ): Promise<LectureMaterialResponse | undefined> => {
        const form = new FormData();
        form.append("title", request.title);
        form.append("orderIndex", String(request.orderIndex));
        form.append("isVisible", String(request.isVisible));
        if (request.description) form.append("description", request.description);
        form.append("file", request.file);
        const response = await API.postForm<LectureMaterialResponse>(`/lecture/${lectureId}/materials/video`, form);
        if (response.success) return response.data;
        return undefined;
    },

    deleteMaterial: async (materialId: string): Promise<boolean> => {
        const response = await API.delete(`/lecture/materials/${materialId}`);
        return response.success && response.statusCode === 204;
    },

    fileUrl: (pathFromApi: string | null | undefined): string => {
        if (!pathFromApi) return "";
        if (pathFromApi.startsWith("http")) return pathFromApi;
        return `${API_ORIGIN}${pathFromApi}`;
    },
};

export default Lecture;
