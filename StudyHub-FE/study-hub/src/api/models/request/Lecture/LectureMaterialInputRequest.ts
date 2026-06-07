import { APIRequestBase } from "../base/APIRequestBase";
import { MaterialType } from "../../response/LectureMaterialResponse";

export interface LectureMaterialInputRequest extends APIRequestBase {
    type: MaterialType;
    title: string;
    description?: string | null;
    orderIndex: number;
    isVisible: boolean;
    content?: string | null;
    language?: string | null;
    externalUrl?: string | null;
    durationSeconds?: number | null;
}
