import { useEffect, useState, useCallback } from "react";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import PageHeader from "../../components/PageHeader/PageHeader";
import shell from "../../layouts/AuthenticatedShell.module.css";
import styles from "./AssignmentBuilderPage.module.css";
import { Box, Button, IconButton, Switch, TextField, Tooltip, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import { Question } from "../../api/Question";
import type { TaskOptions } from "../../api/TaskOption";
import ModeSelector, { questionTypeLabel } from "../../components/AssignmentBuilder/ModeBuilder";
import QuestionList from "../../components/AssignmentBuilder/QuestionList";
import QuestionBanksPanel from "../../components/AssignmentBuilder/QuestionModule";
import { useForm } from "react-hook-form";
import { CreateAssignmentTaskRequest } from "../../api/models/request/Variant/CreateAssignmentTask";
import { yupResolver } from "@hookform/resolvers/yup";
import { createAssignmentTaskValidationSchema } from "../../validation/CreateAssignmentTaskValidationSchema";
import {
    mapQuestionToVariant,
    mapVariantToQuestion,
    taskLooksLikeChoiceBank,
} from "../../api/mapper/mapQuestionToVariant";
import useNotification from "../../hooks/useNotification";
import { useNavigate, useParams } from "react-router-dom";
import Assignment from "../../api/Assignment";
import { AssignmentKind } from "../../api/models/response/AssignmentResponse";
import { isAssignmentTaskMarkLimitServerMessage } from "../../utils/apiErrorMessage";
import { AssignmentTask } from "../../api/models/response/AssignmentTask";

const emptyChoiceOptions = (): TaskOptions[] => [
    { label: "", isCorrect: false },
    { label: "", isCorrect: false },
];

const configFieldLabelSx = {
    display: "block",
    mb: 0.75,
    fontWeight: 600,
    fontSize: "0.8125rem",
    color: "#5b21b6",
} as const;

const summaryHighlightSx = { fontWeight: 700, color: "#7c3aed" } as const;

const AssignmentBuilderPage = () => {
    const [user, setUser] = useState<UserResponse | undefined>(undefined);
    const { notifyError, notifySuccess } = useNotification();
    const [activeMode, setActiveMode] = useState<"Single" | "Multi" | "RichText" | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [variants, setVariants] = useState<AssignmentTask[]>([]);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [mathMode, setMathMode] = useState(false);
    const [assignmentOpeningAtMs, setAssignmentOpeningAtMs] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        setError,
        clearErrors,
    } = useForm({
        resolver: yupResolver(createAssignmentTaskValidationSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            maxMark: 3,
        },
    });

    const markWatch = watch("maxMark");
    const maxMarkRegister = register("maxMark", { valueAsNumber: true });

    useEffect(() => {
        const gate = async () => {
            if (!assignmentId || !subjectId) return;
            const meta = await Assignment.getAssignment(assignmentId);
            if (!meta) {
                setAssignmentOpeningAtMs(null);
                return;
            }
            const openMs = new Date(meta.openingDate).getTime();
            setAssignmentOpeningAtMs(Number.isNaN(openMs) ? null : openMs);
            if ((meta.kind ?? AssignmentKind.TimedTest) === AssignmentKind.Homework) {
                navigate(`/subject/${subjectId}/course-task/${assignmentId}`, { replace: true });
            }
        };
        gate();
    }, [assignmentId, subjectId, navigate]);

    const isTestOpenedForGrading =
        assignmentOpeningAtMs != null && assignmentOpeningAtMs <= Date.now();

    const fetchVariants = useCallback(async () => {
        if (!assignmentId) return;
        const response = await Assignment.getAssignmentVariant(assignmentId);
        if (response) {
            setVariants(response);
            setQuestions([]);
            setActiveIndex(null);
            setIsEditing(false);
            setActiveMode(null);
        }
    }, [assignmentId]);

    useEffect(() => {
        if (activeIndex !== null && variants[activeIndex]?.maxMark !== undefined) {
            setValue("maxMark", variants[activeIndex].maxMark);
        }
    }, [activeIndex, variants, setValue]);

    useEffect(() => {
        fetchVariants();
    }, [fetchVariants]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await User.me();
                setUser(response);
            } catch (error) {
                console.error(error);
                setUser(undefined);
            }
        };

        fetchUser();
    }, []);

    const handleSetActiveMode = (type: "Single" | "Multi" | "RichText") => {
        setActiveMode(type);
        if (questions.length === 0) {
            setQuestions([
                type === "RichText"
                    ? { label: "", options: [], type, referenceAnswer: "" }
                    : { label: "", options: emptyChoiceOptions(), type },
            ]);
            return;
        }
        setQuestions(
            questions.map((q) => {
                if (type === "RichText") {
                    return {
                        label: q.label,
                        type,
                        options: [],
                        referenceAnswer: q.referenceAnswer ?? "",
                    };
                }
                return {
                    label: q.label,
                    options: q.options.length ? q.options : emptyChoiceOptions(),
                    type,
                };
            }),
        );
    };

    const addQuestion = () => {
        if (!activeMode) return;
        setQuestions([
            ...questions,
            activeMode === "RichText"
                ? { label: "", options: [], type: activeMode, referenceAnswer: "" }
                : { label: "", options: emptyChoiceOptions(), type: activeMode },
        ]);
    };

    const saveChanges = async (data: { maxMark: number }) => {
        if (!assignmentId) {
            notifyError("Missing assignment.");
            return;
        }
        if (!activeMode) {
            notifyError("Choose a question type.");
            return;
        }
        if (questions.length === 0) {
            notifyError("Add at least one question.");
            return;
        }
        try {
            clearErrors("maxMark");
            const payload: CreateAssignmentTaskRequest = {
                maxMark: data.maxMark,
                assignmentId,
                taskVariants: questions.map(mapQuestionToVariant),
            };

            if (isEditing && activeIndex !== null) {
                const updatedVariant = { ...variants[activeIndex], ...payload };
                await Assignment.updateAssignmentTask(updatedVariant);
                notifySuccess("Test bank saved.");
                setVariants(variants.map((v, i) => (i === activeIndex ? updatedVariant : v)));
            } else {
                await Assignment.createAssignmentTask(payload);
                notifySuccess("Test bank saved.");
                fetchVariants();
            }

            setActiveIndex(null);
            setIsEditing(false);
            setQuestions([]);
            setActiveMode(null);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            if (msg && isAssignmentTaskMarkLimitServerMessage(msg)) {
                setError("maxMark", { type: "server", message: "" });
            }
        }
    };

    const handleEditVariant = (index: number) => {
        const raw = variants[index].taskVariants;
        const choiceBank = taskLooksLikeChoiceBank(raw);
        const mapped = raw.map((v) => mapVariantToQuestion(v, { forceChoiceBank: choiceBank }));
        setQuestions(mapped);
        setActiveIndex(index);
        setIsEditing(true);
        setActiveMode(mapped[0]?.type ?? null);
    };

    const handleCreateVariant = () => {
        setIsEditing(false);
        setActiveIndex(null);
        setQuestions([]);
        setActiveMode(null);
        setValue("maxMark", 3);
    };

    const handleDeleteVariant = async (index: number) => {
        try {
            await Assignment.deleteAssignmentTask(variants[index].id);
            setVariants(variants.filter((_, i) => i !== index));
            if (activeIndex === index) {
                setActiveIndex(null);
                setQuestions([]);
                setActiveMode(null);
            }
            notifySuccess("Task removed.");
        } catch {
            /* Server message shown globally */
        }
    };

    const bankSummaryType = questionTypeLabel(activeMode);
    const markDisplay =
        typeof markWatch === "number" && Number.isFinite(markWatch) && markWatch > 0
            ? markWatch
            : "…";

    const subjectPath = subjectId ? `/subject/${subjectId}` : "/subjects";

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="subjects" user={user} />
                <div className={`${shell.mainScroll} ${styles.pageInner}`}>
                    <div className={styles.pagePadding}>
                        <div className={styles.topBar}>
                            <div className={styles.topBarLeft}>
                                <Button
                                    className={styles.backLink}
                                    component={RouterLink}
                                    to={subjectPath}
                                    startIcon={<ArrowBackIcon sx={{ fontSize: 20 }} />}
                                    variant="text"
                                    sx={{ color: "#d41a6d" }}
                                >
                                    Back to subject
                                </Button>
                                <Typography component="h1" className={styles.pageTitle}>
                                    Test creation
                                </Typography>
                                <Typography className={styles.subtitle}>Prepare your bank of questions</Typography>
                            </div>
                            <div className={styles.topBarRight}>
                                {isTestOpenedForGrading && (
                                    <Button
                                        className={styles.gradeOpenEndedBtn}
                                        component={RouterLink}
                                        to={
                                            subjectId && assignmentId
                                                ? `/subject/${subjectId}/open-ended-grade/${assignmentId}`
                                                : "#"
                                        }
                                        variant="outlined"
                                        color="primary"
                                        disabled={!subjectId || !assignmentId}
                                    >
                                        Grade open-ended
                                    </Button>
                                )}
                                <Button
                                    className={styles.saveBtn}
                                    variant="contained"
                                    color="success"
                                    startIcon={<SaveIcon />}
                                    disabled={questions.length === 0 || !activeMode}
                                    onClick={handleSubmit(saveChanges)}
                                >
                                    Save test
                                </Button>
                            </div>
                        </div>

                        <div className={styles.mainRow}>
                            <div className={styles.editorColumn}>
                                <div className={styles.configCard}>
                                    <Typography
                                        component="h2"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: "1.05rem",
                                            color: "#1a1a1a",
                                            mb: 1.25,
                                        }}
                                    >
                                        Question bank configuration
                                    </Typography>
                                    <div className={styles.configTop}>
                                        <Box className={styles.configMarkWrap}>
                                            <Typography
                                                component="label"
                                                htmlFor="mark-per-question"
                                                variant="subtitle2"
                                                sx={configFieldLabelSx}
                                            >
                                                Mark per question
                                            </Typography>
                                            <TextField
                                                id="mark-per-question"
                                                size="small"
                                                type="number"
                                                fullWidth
                                                placeholder="e.g. 2"
                                                {...maxMarkRegister}
                                                onChange={(e) => {
                                                    clearErrors("maxMark");
                                                    maxMarkRegister.onChange(e);
                                                }}
                                                error={!!errors.maxMark}
                                                helperText={false}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "10px",
                                                        backgroundColor: "#fff",
                                                        ...(!errors.maxMark && {
                                                            "& fieldset": {
                                                                borderColor: "rgba(124, 58, 237, 0.35)",
                                                            },
                                                            "&:hover fieldset": {
                                                                borderColor: "rgba(124, 58, 237, 0.5)",
                                                            },
                                                        }),
                                                    },
                                                }}
                                            />
                                        </Box>
                                        <div className={styles.configTypeWrap}>
                                            <ModeSelector
                                                activeMode={activeMode}
                                                handleSetActiveMode={handleSetActiveMode}
                                            />
                                        </div>
                                    </div>

                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 1.75,
                                            borderRadius: "12px",
                                            bgcolor: "#fff",
                                            border: "1px solid",
                                            borderColor: "rgba(0, 0, 0, 0.08)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <CalculateOutlinedIcon sx={{ color: "#7c3aed", fontSize: 32 }} />
                                        <Box sx={{ flex: "1 1 180px", minWidth: 0 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>
                                                    Math mode
                                                </Typography>
                                                <Tooltip
                                                    title="When on, stems and options use the equation editor. Use Σ Formula for templates. LaTeX is saved with the task."
                                                    arrow
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        aria-label="About math mode"
                                                        sx={{
                                                            color: "#7c3aed",
                                                            p: 0.25,
                                                            "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.08)" },
                                                        }}
                                                    >
                                                        <HelpOutlineIcon sx={{ fontSize: 20 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.35, fontSize: "0.8125rem" }}>
                                                Enable mathematical notation and formulas
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={mathMode}
                                            onChange={(_, c) => setMathMode(c)}
                                            inputProps={{ "aria-label": "Toggle math mode" }}
                                            sx={{
                                                ml: { xs: 0, sm: "auto" },
                                                "& .MuiSwitch-switchBase.Mui-checked": {
                                                    color: "#7c3aed",
                                                },
                                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                                    backgroundColor: "rgba(124, 58, 237, 0.5)",
                                                },
                                            }}
                                        />
                                    </Box>

                                    <Typography className={styles.configSummary} component="div">
                                        {activeMode ? (
                                            <>
                                                All questions in this bank will have{" "}
                                                <Box component="span" sx={summaryHighlightSx}>
                                                    {markDisplay} marks
                                                </Box>{" "}
                                                and be{" "}
                                                <Box component="span" sx={summaryHighlightSx}>
                                                    {bankSummaryType}
                                                </Box>{" "}
                                                type
                                                {mathMode ? (
                                                    <>
                                                        {" "}
                                                        with{" "}
                                                        <Box component="span" sx={summaryHighlightSx}>
                                                            mathematical notation
                                                        </Box>{" "}
                                                        enabled.
                                                    </>
                                                ) : (
                                                    "."
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                Choose marks and a question type to start building this bank. Use{" "}
                                                <Box component="span" sx={summaryHighlightSx}>
                                                    Math mode
                                                </Box>{" "}
                                                above when you need equations.
                                            </>
                                        )}
                                    </Typography>
                                </div>

                                {questions.length === 0 ? (
                                    <Typography sx={{ color: "#6b7280", fontSize: "0.95rem" }}>
                                        Select a question type above, or open a task from &quot;Question banks&quot; on
                                        the right.
                                    </Typography>
                                ) : (
                                    <>
                                        <QuestionList
                                            questions={questions}
                                            setQuestions={setQuestions}
                                            bankMark={typeof markWatch === "number" ? markWatch : 0}
                                            bankTypeKey={activeMode}
                                            mathMode={mathMode}
                                        />
                                        <Button
                                            variant="outlined"
                                            onClick={addQuestion}
                                            disabled={!activeMode}
                                            sx={{
                                                alignSelf: "flex-start",
                                                textTransform: "none",
                                                fontWeight: 600,
                                                borderRadius: "10px",
                                                borderColor: "rgba(212, 26, 109, 0.4)",
                                                color: "#d41a6d",
                                            }}
                                        >
                                            + Add question
                                        </Button>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "0.75rem",
                                                justifyContent: "flex-end",
                                                flexWrap: "wrap",
                                                paddingTop: "0.5rem",
                                            }}
                                        >
                                            <Button
                                                variant="text"
                                                onClick={handleCreateVariant}
                                                sx={{ textTransform: "none", fontWeight: 600, color: "#6b7280" }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="contained"
                                                onClick={handleSubmit(saveChanges)}
                                                disabled={questions.length === 0 || !activeMode}
                                                sx={{
                                                    textTransform: "none",
                                                    fontWeight: 600,
                                                    borderRadius: "10px",
                                                    backgroundColor: "#2e7d32",
                                                    "&:hover": { backgroundColor: "#1b5e20" },
                                                }}
                                            >
                                                Save test
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <aside className={styles.sidebar}>
                                <QuestionBanksPanel
                                    tasks={variants}
                                    selectedTaskIndex={isEditing ? activeIndex : null}
                                    onTaskClick={handleEditVariant}
                                    onDeleteTask={handleDeleteVariant}
                                    onAddTask={handleCreateVariant}
                                />
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentBuilderPage;
