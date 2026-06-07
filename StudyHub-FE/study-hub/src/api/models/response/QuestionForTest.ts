import TaskOption from "./TaksOption";

interface QuestionForTest {
    guid: string;
    id: number;
    type: 'select' | 'multi-select' | 'open';
    question: string;
    options?: TaskOption[];
}

export default QuestionForTest;