export interface AddLectureVideoMaterialRequest {
    file: File;
    title: string;
    description?: string;
    orderIndex: number;
    isVisible: boolean;
}
