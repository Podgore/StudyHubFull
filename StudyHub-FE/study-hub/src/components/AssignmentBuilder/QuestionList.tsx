import { Box, TextField, Typography, IconButton, ToggleButton, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Question } from "../../api/Question";
import { questionTypeLabel } from "./ModeBuilder";
import MathExpressionWithBuilder from "./MathExpressionWithBuilder";
import styles from "./QuestionList.module.css";

interface QuestionListProps {
    questions: Question[];
    setQuestions: (questions: Question[]) => void;
    bankMark: number;
    bankTypeKey: "Single" | "Multi" | "RichText" | null;
    mathMode: boolean;
}

const QuestionList = ({ questions, setQuestions, bankMark, bankTypeKey, mathMode }: QuestionListProps) => {
    const handleQuestionChange = (index: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].label = value;
        setQuestions(updatedQuestions);
    };

    const handleReferenceAnswerChange = (index: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].referenceAnswer = value;
        setQuestions(updatedQuestions);
    };

    const handleOptionChange = (index: number, optionIndex: number, value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].options[optionIndex].label = value;
        setQuestions(updatedQuestions);
    };

    const handleCorrectAnswerChange = (index: number, optionIndex: number, isChecked: boolean) => {
        const updatedQuestions = [...questions];
        if (questions[index].type === "Single") {
            updatedQuestions[index].options = updatedQuestions[index].options.map((option, idx) => ({
                ...option,
                isCorrect: idx === optionIndex ? isChecked : false,
            }));
        } else {
            updatedQuestions[index].options[optionIndex].isCorrect = isChecked;
        }
        setQuestions(updatedQuestions);
    };

    const deleteQuestion = (index: number) => {
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
    };

    const addOption = (index: number) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].options.push({ label: "", isCorrect: false });
        setQuestions(updatedQuestions);
    };

    const deleteOption = (questionIndex: number, optionIndex: number) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter(
            (_, i) => i !== optionIndex,
        );
        setQuestions(updatedQuestions);
    };

    const typeLabel = questionTypeLabel(bankTypeKey);
    const markLabel = Number.isFinite(bankMark) && bankMark > 0 ? String(bankMark) : "—";

    return (
        <>
            {questions.map((question, index) => (
                <div key={index} className={styles.card}>
                    <div className={styles.cardHeader}>
                        <DragIndicatorIcon className={styles.dragHint} fontSize="small" aria-hidden />
                        <div className={styles.headerTitles}>
                            <Typography className={styles.questionHeading} component="div">
                                Question {index + 1}
                            </Typography>
                            <Typography className={styles.metaLine}>
                                {markLabel} marks • {typeLabel || "…"}
                                {mathMode ? " • Math" : ""}
                            </Typography>
                        </div>
                        <IconButton
                            size="small"
                            aria-label={`Delete question ${index + 1}`}
                            className={styles.deleteQuestionBtn}
                            onClick={() => deleteQuestion(index)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </div>

                    {question.type === "RichText" && mathMode && (
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed", mb: 0.75 }}>
                                Question {index + 1}{" "}
                                <Typography component="span" sx={{ fontWeight: 600, opacity: 0.95 }}>
                                    (Math mode: use $...$ for formulas)
                                </Typography>
                            </Typography>
                            <MathExpressionWithBuilder
                                value={question.label}
                                onChange={(v) => handleQuestionChange(index, v)}
                                minHeight={52}
                            />
                        </Box>
                    )}

                    {question.type === "RichText" && !mathMode && (
                        <TextField
                            sx={{ mt: 1 }}
                            label={`Question ${index + 1}`}
                            variant="outlined"
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            value={question.label}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                        />
                    )}

                    {question.type === "RichText" && mathMode && (
                        <Box sx={{ mt: 1.5 }}>
                            <Typography
                                component="span"
                                sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", display: "block", mb: 0.5 }}
                            >
                                Expected answer (reference)
                            </Typography>
                            <MathExpressionWithBuilder
                                value={question.referenceAnswer ?? ""}
                                onChange={(v) => handleReferenceAnswerChange(index, v)}
                                minHeight={52}
                            />
                        </Box>
                    )}

                    {question.type === "RichText" && !mathMode && (
                        <TextField
                            sx={{ marginTop: "1rem" }}
                            label="Expected answer (for grading reference)"
                            variant="outlined"
                            fullWidth
                            size="small"
                            multiline
                            minRows={3}
                            value={question.referenceAnswer ?? ""}
                            onChange={(e) => handleReferenceAnswerChange(index, e.target.value)}
                        />
                    )}

                    {question.type !== "RichText" && mathMode && (
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed", mb: 0.75 }}>
                                Question {index + 1}{" "}
                                <Typography component="span" sx={{ fontWeight: 600, opacity: 0.95 }}>
                                    (Math mode: use $...$ for formulas)
                                </Typography>
                            </Typography>
                            <MathExpressionWithBuilder
                                value={question.label}
                                onChange={(v) => handleQuestionChange(index, v)}
                                minHeight={48}
                            />
                        </Box>
                    )}

                    {question.type !== "RichText" && !mathMode && (
                        <TextField
                            sx={{ mt: 1 }}
                            label={`Question ${index + 1}`}
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={question.label}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                        />
                    )}

                    {question.type !== "RichText" && (
                        <div className={styles.optionsBlock}>
                            {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className={styles.optionRow}>
                                    <Typography
                                        className={styles.optionLabel}
                                        component="span"
                                        id={`q${index}-opt${optionIndex}-label`}
                                    >
                                        Option {optionIndex + 1}
                                    </Typography>
                                    <div className={styles.optionField}>
                                        {mathMode ? (
                                            <MathExpressionWithBuilder
                                                value={option.label}
                                                onChange={(v) => handleOptionChange(index, optionIndex, v)}
                                                minHeight={44}
                                                aria-labelledby={`q${index}-opt${optionIndex}-label`}
                                                variant="compact"
                                            />
                                        ) : (
                                            <TextField
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                placeholder="Answer text"
                                                value={option.label}
                                                onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                                inputProps={{
                                                    "aria-labelledby": `q${index}-opt${optionIndex}-label`,
                                                }}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.optionTrailing}>
                                        <ToggleButton
                                            value="correct"
                                            size="small"
                                            selected={option.isCorrect}
                                            onClick={() =>
                                                handleCorrectAnswerChange(index, optionIndex, !option.isCorrect)
                                            }
                                            sx={{
                                                textTransform: "none",
                                                fontWeight: 600,
                                                fontSize: "0.8125rem",
                                                px: 1.25,
                                                py: 0.5,
                                                borderRadius: "10px",
                                                whiteSpace: "nowrap",
                                                borderColor: "rgba(212, 26, 109, 0.35)",
                                                gap: 0.35,
                                                "&.Mui-selected": {
                                                    backgroundColor: "rgba(212, 26, 109, 0.2)",
                                                    color: "#ad1457",
                                                    borderColor: "rgba(212, 26, 109, 0.55)",
                                                },
                                                "&.Mui-selected:hover": {
                                                    backgroundColor: "rgba(212, 26, 109, 0.28)",
                                                },
                                            }}
                                        >
                                            {option.isCorrect ? (
                                                <CheckRoundedIcon sx={{ fontSize: 18, mr: 0.25 }} aria-hidden />
                                            ) : null}
                                            Correct
                                        </ToggleButton>
                                        <IconButton
                                            size="small"
                                            aria-label={`Delete option ${optionIndex + 1}`}
                                            onClick={() => deleteOption(index, optionIndex)}
                                            sx={{ color: "#9ca3af" }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {question.type !== "RichText" && (
                        <Button className={styles.addOptionBtn} onClick={() => addOption(index)} disableRipple>
                            ADD OPTION
                        </Button>
                    )}
                </div>
            ))}
        </>
    );
};

export default QuestionList;
