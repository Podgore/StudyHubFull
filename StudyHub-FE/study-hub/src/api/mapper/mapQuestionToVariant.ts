import { CreateVariantRequest } from "../models/request/Variant/CreateVariantRequest";
import { Question } from "../Question";

export const mapQuestionToVariant = (question: Question): CreateVariantRequest => {
    if (question.type === "RichText") {
        const answer = question.referenceAnswer?.trim();
        return {
            label: question.label,
            taskOption: answer ? [{ label: answer, isCorrect: false }] : [],
        };
    }

    return {
        label: question.label,
        taskOption: question.options,
    };
};

export const taskLooksLikeChoiceBank = (variants: CreateVariantRequest[]): boolean =>
    variants.some(
        (v) => v.taskOption.length >= 2 || v.taskOption.some((o) => o.isCorrect === true),
    );

export type MapVariantToQuestionOptions = {
    forceChoiceBank?: boolean;
};

export const mapVariantToQuestion = (
    variant: CreateVariantRequest,
    options?: MapVariantToQuestionOptions,
): Question => {
    const forceChoice = options?.forceChoiceBank === true;
    const correctOptions = variant.taskOption.filter((option) => option.isCorrect === true);
    let type: "Single" | "Multi" | "RichText";
    let referenceAnswer: string | undefined;

    if (variant.taskOption.length === 0) {
        type = "RichText";
    } else if (correctOptions.length > 1) {
        type = "Multi";
    } else if (correctOptions.length === 1) {
        type = "Single";
    } else if (variant.taskOption.length > 1) {
        // Multiple options but none marked correct — still MC (in progress or legacy data)
        type = "Single";
    } else if (forceChoice) {
        // One row, no correct flag, but siblings show this bank is multiple-choice
        type = "Single";
    } else {
        // Typical open-ended encoding: one non-correct "option" holding the reference text
        type = "RichText";
        referenceAnswer = variant.taskOption[0]?.label ?? "";
    }

    return {
        label: variant.label,
        options: type === "RichText" ? [] : variant.taskOption,
        type,
        ...(type === "RichText" && referenceAnswer !== undefined ? { referenceAnswer } : {}),
    };
};
