import { CreateVariantRequest } from "./CreateVariantRequest";

export interface CreateAssignmentTaskRequest{
    assignmentId: string | undefined;
    maxMark: number;
    taskVariants: CreateVariantRequest[];
}