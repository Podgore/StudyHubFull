import { APIRequestBase } from "../base/APIRequestBase";

export interface SendTestAnswers extends APIRequestBase {
    assignmentId: string;
    answerVariants: AnswerVariant[];
}

export interface AnswerVariant {
    taskVariantId: string;
    answer?: string | null;
    taskOptionIds?: string[] | null;
}