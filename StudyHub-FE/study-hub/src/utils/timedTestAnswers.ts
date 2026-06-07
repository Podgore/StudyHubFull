import QuestionForTest from "../api/models/response/QuestionForTest";
import SavedTestAnswer from "../api/models/response/SavedTestAnswer";

export interface TestAnswerState {
    guid: string | string[];
}

export function hydrateAnswersFromServer(
    questions: QuestionForTest[],
    savedAnswers: SavedTestAnswer[] | undefined,
): Record<number, TestAnswerState> {
    if (!savedAnswers?.length) return {};

    const result: Record<number, TestAnswerState> = {};

    for (const question of questions) {
        const row = savedAnswers.find((s) => s.taskVariantId === question.guid);
        if (!row) continue;

        if (question.type === "open") {
            if (row.answer?.trim()) {
                result[question.id] = { guid: row.answer };
            }
            continue;
        }

        const ids = row.taskOptionIds?.filter(Boolean) ?? [];
        if (ids.length === 1) {
            result[question.id] = { guid: ids[0] };
        } else if (ids.length > 1) {
            result[question.id] = { guid: ids };
        }
    }

    return result;
}

export function selectedLabelsForQuestion(
    question: QuestionForTest | undefined,
    answer: TestAnswerState | undefined,
): string[] {
    if (!question?.options?.length || !answer) return [];

    const raw = answer.guid;
    const ids = Array.isArray(raw) ? raw.map(String) : raw != null && raw !== "" ? [String(raw)] : [];
    if (ids.length === 0) return [];

    return question.options.filter((option) => ids.includes(option.id)).map((option) => option.label);
}
