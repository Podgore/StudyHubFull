import { TaskOptions } from "./TaskOption";

export interface Question {
    label: string;
    options: TaskOptions[];
    type: "Single" | "Multi" | "RichText";
    referenceAnswer?: string;
}