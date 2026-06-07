import { Box, Chip, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { AssignmentTask } from "../../api/models/response/AssignmentTask";
import { mapVariantToQuestion, taskLooksLikeChoiceBank } from "../../api/mapper/mapQuestionToVariant";

interface QuestionBanksPanelProps {
    tasks: AssignmentTask[];
    selectedTaskIndex: number | null;
    onTaskClick: (index: number) => void;
    onDeleteTask: (index: number) => void;
    onAddTask: () => void;
}

const typeShortLabel = (task: AssignmentTask): string => {
    const first = task.taskVariants[0];
    if (!first) return "—";
    const choiceBank = taskLooksLikeChoiceBank(task.taskVariants);
    const q = mapVariantToQuestion(first, { forceChoiceBank: choiceBank });
    if (q.type === "Multi") return "Multi";
    if (q.type === "Single") return "Single";
    return "Text";
};

const QuestionBanksPanel = ({
    tasks,
    selectedTaskIndex,
    onTaskClick,
    onDeleteTask,
    onAddTask,
}: QuestionBanksPanelProps) => {
    return (
        <Box>
            <Typography component="h2" sx={{ fontWeight: 700, mb: 1.5, fontSize: "1.05rem", color: "#1a1a1a" }}>
                Question banks
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {tasks.map((task, index) => {
                    const selected = selectedTaskIndex === index;
                    const n = task.taskVariants?.length ?? 0;
                    return (
                        <Box
                            key={task.id ?? index}
                            onClick={() => onTaskClick(index)}
                            sx={{
                                borderRadius: "12px",
                                p: 1.5,
                                cursor: "pointer",
                                border: "2px solid",
                                borderColor: selected ? "rgba(124, 58, 237, 0.85)" : "rgba(0,0,0,0.08)",
                                backgroundColor: selected ? "rgba(124, 58, 237, 0.06)" : "#fff",
                                boxShadow: selected ? "0 0 0 1px rgba(124, 58, 237, 0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
                                transition: "border-color 0.15s ease, background-color 0.15s ease",
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 1,
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#1a1a1a" }}>
                                    Task {index + 1}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                                    <Chip
                                        size="small"
                                        label={`${task.maxMark} pts`}
                                        sx={{
                                            fontWeight: 600,
                                            backgroundColor: "rgba(25, 118, 210, 0.12)",
                                            color: "#1565c0",
                                            border: "none",
                                        }}
                                    />
                                    <Chip
                                        size="small"
                                        label={typeShortLabel(task)}
                                        sx={{
                                            fontWeight: 600,
                                            backgroundColor: "rgba(46, 125, 50, 0.14)",
                                            color: "#2e7d32",
                                            border: "none",
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1, color: "#6b7280", fontSize: "0.8rem" }}>
                                    {n} question{n === 1 ? "" : "s"}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                aria-label="Delete task"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask(index);
                                }}
                                sx={{ color: "#9ca3af", "&:hover": { color: "#d41a6d", backgroundColor: "rgba(212,26,109,0.08)" } }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    );
                })}
                <Box
                    onClick={onAddTask}
                    sx={{
                        borderRadius: "12px",
                        py: 2,
                        px: 1.5,
                        cursor: "pointer",
                        border: "2px dashed",
                        borderColor: "rgba(124, 58, 237, 0.45)",
                        backgroundColor: "rgba(124, 58, 237, 0.04)",
                        textAlign: "center",
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                            backgroundColor: "rgba(124, 58, 237, 0.09)",
                        },
                    }}
                >
                    <Typography sx={{ fontWeight: 600, color: "#7c3aed", fontSize: "0.95rem" }}>+ Add task</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default QuestionBanksPanel;
