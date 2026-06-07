import { MaterialType } from "../api/models/response/LectureMaterialResponse";

export function formatLectureDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
}

export function materialTypeLabel(t: MaterialType): string {
    switch (t) {
        case MaterialType.File:
            return "File";
        case MaterialType.Video:
            return "Video";
        case MaterialType.Link:
            return "Link";
        case MaterialType.Text:
            return "Text";
        case MaterialType.Code:
            return "Code";
        default:
            return "Material";
    }
}
