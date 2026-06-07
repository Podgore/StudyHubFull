import type { LectureMaterialResponse } from "./LectureMaterialResponse";

export interface LectureResponse {
    id: string;
    subjectId: string;
    title: string;
    description: string;
    lectureDate: string;
    materials: LectureMaterialResponse[];
}
