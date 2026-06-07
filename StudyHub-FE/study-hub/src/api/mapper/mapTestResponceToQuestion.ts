import QuestionForTest from "../models/response/QuestionForTest";
import TestTasks from "../models/response/TestTasks";

export const mapTestResponceToQuestion = (testTasks: TestTasks[]): QuestionForTest[] => {
    return testTasks.map((task, index) => ({
        guid: task.id,
        id: index + 1,
        type: mapQuestionType(task.questionType),
        question: task.label,
        options: task.taskOption,
    }));
}

function mapQuestionType(questionType: number): 'select' | 'multi-select' | 'open' {
    switch (questionType) {
        case 0:
            return 'select';
        case 1:
            return 'multi-select';
        default:
            return 'open';
    }
}