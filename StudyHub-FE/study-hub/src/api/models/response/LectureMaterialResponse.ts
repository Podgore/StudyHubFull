export enum MaterialType {
    File = 0,
    Video = 1,
    Link = 2,
    Text = 3,
    Code = 4,
}

export interface LectureMaterialResponse {
    id: string;
    lectureId: string;
    title: string;
    description?: string | null;
    type: MaterialType;
    orderIndex: number;
    isVisible: boolean;
    fileName?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    fileDownloadUrl?: string | null;
    externalUrl?: string | null;
    videoPlaybackUrl?: string | null;
    videoMimeType?: string | null;
    videoStoredFileName?: string | null;
    durationSeconds?: number | null;
    textContent?: string | null;
    language?: string | null;
}
