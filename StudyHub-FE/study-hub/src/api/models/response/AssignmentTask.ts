import { CreateVariantRequest } from "../request/Variant/CreateVariantRequest";

export interface AssignmentTask{
    id:string | undefined;
    assignmentId: string | undefined;
    maxMark: number;
    taskVariants: CreateVariantRequest[];
}