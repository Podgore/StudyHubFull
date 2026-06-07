import { TaskOptions } from "../../../TaskOption";

export interface CreateVariantRequest{
    label: string;
    taskOption: TaskOptions[];
}