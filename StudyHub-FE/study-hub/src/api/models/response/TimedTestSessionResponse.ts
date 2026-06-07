import TestTasks from "./TestTasks";
import SavedTestAnswer from "./SavedTestAnswer";

export default interface TimedTestSessionResponse {
    sessionId: string;
    sessionHash: string;
    remainingTime: string;
    tasks: TestTasks[];
    savedAnswers?: SavedTestAnswer[];
}
