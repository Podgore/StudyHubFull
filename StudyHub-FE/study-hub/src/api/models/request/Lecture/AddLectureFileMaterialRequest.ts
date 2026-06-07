export interface AddLectureFileMaterialRequest {
    file: File;
    title: string;
    description?: string;
    orderIndex: number;
    isVisible: boolean;
}
