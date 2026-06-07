export default interface SavedTestAnswer {
    taskVariantId: string;
    answer: string | null;
    taskOptionIds: string[] | null;
}
