import { Box, FormControl, Grid, TextField } from "@mui/material";
import QuestionForTest from "../../api/models/response/QuestionForTest";
import TaskOption from "../../api/models/response/TaksOption";
import { TestMathContent } from "./TestMathContent";

interface Answer {
    guid: string | string[];
}

const ACCENT_BORDER = "rgba(124, 58, 237, 0.55)";
const SELECTED_BG = "rgba(124, 58, 237, 0.12)";

const QuestionRenderer = ({
    question,
    selectedOptions,
    answers,
    handleBoxClick,
    handleChange,
}: {
    question: QuestionForTest;
    selectedOptions: string[];
    answers: Record<number, Answer>;
    handleBoxClick: (option: string, isMulti: boolean, quid: string) => void;
    handleChange: (questionId: number, value: string | string[]) => void;
}) => {
    const isOptionSelected = (option: string) => selectedOptions.includes(option);

    const n = question.options?.length ?? 0;
    const gridMd = n <= 1 ? 12 : n === 2 ? 6 : n === 3 ? 4 : 3;

    switch (question.type) {
        case "multi-select":
        case "select":
            return (
                <FormControl component="fieldset" sx={{ width: "100%", maxWidth: 920, mx: "auto" }}>
                    <Grid container spacing={2} justifyContent="center" alignItems="stretch">
                        {question.options?.map((option: TaskOption) => (
                            <Grid key={option.id} item xs={12} sm={n === 1 ? 12 : 6} md={gridMd}>
                                <Box
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleBoxClick(
                                                option.label,
                                                question.type === "multi-select",
                                                option.id,
                                            );
                                        }
                                    }}
                                    onClick={() =>
                                        handleBoxClick(
                                            option.label,
                                            question.type === "multi-select",
                                            option.id,
                                        )
                                    }
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        minHeight: { xs: 100, sm: 120 },
                                        px: 2,
                                        py: 2,
                                        border: "2px solid",
                                        borderColor: isOptionSelected(option.label) ? ACCENT_BORDER : "rgba(0,0,0,0.1)",
                                        backgroundColor: isOptionSelected(option.label) ? SELECTED_BG : "#fff",
                                        cursor: "pointer",
                                        borderRadius: "14px",
                                        transition: "border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
                                        boxShadow: isOptionSelected(option.label)
                                            ? "0 0 0 1px rgba(124, 58, 237, 0.2)"
                                            : "0 1px 2px rgba(0,0,0,0.04)",
                                        "&:hover": {
                                            borderColor: ACCENT_BORDER,
                                            backgroundColor: isOptionSelected(option.label) ? SELECTED_BG : "rgba(124, 58, 237, 0.04)",
                                        },
                                    }}
                                >
                                    <TestMathContent text={option.label} variant="option" />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </FormControl>
            );
        case "open":
            return (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        width: "100%",
                        maxWidth: 920,
                        mx: "auto",
                    }}
                >
                    <TextField
                        label="Your answer"
                        multiline
                        minRows={8}
                        variant="outlined"
                        fullWidth
                        value={
                            typeof answers[question.id]?.guid === "string"
                                ? answers[question.id].guid
                                : ""
                        }
                        placeholder="Type your response…"
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "#fff",
                            },
                        }}
                        onChange={(e) => handleChange(question.id, e.target.value)}
                    />
                </Box>
            );
        default:
            return null;
    }
};

export default QuestionRenderer;
