import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import UserResponse from "../../api/models/response/UserResponse";
import User from "../../api/User";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import PageHeader from "../../components/PageHeader/PageHeader";
import shell from "../../layouts/AuthenticatedShell.module.css";
import CountdownTimer from "../../components/TestComponents/CountdownTimer";
import Assignment from "../../api/Assignment";
import StudentGrades from "../../api/StudentGrades";
import type StudentAssignmentGradeRowResponse from "../../api/models/response/StudentAssignmentGradeRowResponse";
import QuestionForTest from "../../api/models/response/QuestionForTest";
import { mapTestResponceToQuestion } from "../../api/mapper/mapTestResponceToQuestion";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import QuestionRenderer from "../../components/TestComponents/QuestionRender";
import {
    clearTimedTestSessionCache,
    readTimedTestSessionCache,
    writeTimedTestSessionCache,
} from "../../utils/timedTestSessionCache";
import { AnswerVariant, SendTestAnswers } from "../../api/models/request/Assignment/SendTestAnswers";
import SavedTestAnswer from "../../api/models/response/SavedTestAnswer";
import { TestMathContent } from "../../components/TestComponents/TestMathContent";
import { TestSessionModal } from "../../components/TestComponents/TestSessionModal";
import {
    hydrateAnswersFromServer,
    selectedLabelsForQuestion,
    type TestAnswerState,
} from "../../utils/timedTestAnswers";
import styles from "./AssignmentTaskPage.module.css";

type Answer = TestAnswerState;

const PURPLE = "#7c3aed";
const PURPLE_HOVER = "#6d28d9";

const AssignmentTaskPage: React.FC = () => {
    const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
    const [user, setUser] = useState<UserResponse | undefined>(undefined);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<number, Answer>>({});
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [questions, setQuestions] = useState<QuestionForTest[]>([]);
    const [completedOnServer, setCompletedOnServer] = useState(false);
    const [completedGradeRow, setCompletedGradeRow] = useState<StudentAssignmentGradeRowResponse | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [testUnavailableKind, setTestUnavailableKind] = useState<"fetch-error" | "no-questions" | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionHash, setSessionHash] = useState<string | null>(null);
    const [initialTimerSeconds, setInitialTimerSeconds] = useState(0);
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const navigate = useNavigate();
    const fetchGenerationRef = useRef(0);
    const allowNavigationRef = useRef(false);
    const blockerRef = useRef<ReturnType<typeof useBlocker> | null>(null);
    const saveProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !completedOnServer &&
            !allowNavigationRef.current &&
            currentLocation.pathname !== nextLocation.pathname,
    );
    blockerRef.current = blocker;

    useEffect(() => {
        if (blocker.state === "blocked") {
            setLeaveDialogOpen(true);
        }
    }, [blocker.state]);

    useEffect(() => {
        User.me()
            .then(setUser)
            .catch(() => setUser(undefined));
    }, []);

    useEffect(() => {
        if (completedOnServer) return undefined;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [completedOnServer]);

    useEffect(() => {
        if (!assignmentId) return;

        fetchGenerationRef.current += 1;
        const generation = fetchGenerationRef.current;

        setCurrentQuestionIndex(0);
        setAnswers({});
        setSelectedOptions([]);
        setQuestions([]);
        setCompletedOnServer(false);
        setCompletedGradeRow(undefined);
        setLoading(true);
        setTestUnavailableKind(null);
        setSessionId(null);
        setSessionHash(null);
        setInitialTimerSeconds(0);

        const applySession = (
            sid: string,
            shash: string,
            mappedQuestions: QuestionForTest[],
            remainingTime: string,
            savedAnswers?: SavedTestAnswer[],
        ) => {
            setSessionId(sid);
            setSessionHash(shash);
            setQuestions(mappedQuestions);
            const restoredAnswers = hydrateAnswersFromServer(mappedQuestions, savedAnswers);
            setAnswers(restoredAnswers);
            const firstQuestion = mappedQuestions[0];
            setSelectedOptions(selectedLabelsForQuestion(firstQuestion, restoredAnswers[firstQuestion?.id ?? 0]));
            writeTimedTestSessionCache(assignmentId, {
                sessionId: sid,
                sessionHash: shash,
                questions: mappedQuestions,
            });
            const parts = remainingTime.split(":").map(Number);
            if (parts.length >= 3 && !parts.some((n) => Number.isNaN(n))) {
                setInitialTimerSeconds(parts[0] * 3600 + parts[1] * 60 + parts[2]);
            }
            setTestUnavailableKind(null);
        };

        const load = async () => {
            const status = await Assignment.getTimedTestStatus(assignmentId);
            if (generation !== fetchGenerationRef.current) return;

            if (status?.isFinished) {
                clearTimedTestSessionCache(assignmentId);
                setCompletedOnServer(true);
                setLoading(false);
                return;
            }

            const cached = readTimedTestSessionCache(assignmentId);
            if (cached) {
                const restored = await Assignment.restoreTimedTest(
                    assignmentId,
                    cached.sessionId,
                    cached.sessionHash,
                );
                if (generation !== fetchGenerationRef.current) return;

                if (restored.status === "ok") {
                    const mapped = mapTestResponceToQuestion(restored.session.tasks);
                    applySession(
                        restored.session.sessionId,
                        restored.session.sessionHash,
                        mapped,
                        restored.session.remainingTime,
                        restored.session.savedAnswers,
                    );
                    setLoading(false);
                    return;
                }

                if (restored.status === "finished") {
                    clearTimedTestSessionCache(assignmentId);
                    setCompletedOnServer(true);
                    setLoading(false);
                    return;
                }

                if (restored.status === "invalid-session") {
                    clearTimedTestSessionCache(assignmentId);
                }
            }

            try {
                const started = await Assignment.startTimedTest(assignmentId);
                if (generation !== fetchGenerationRef.current) return;

                if (started.status === "finished") {
                    clearTimedTestSessionCache(assignmentId);
                    setCompletedOnServer(true);
                    return;
                }

                if (started.status === "ok") {
                    const mappedQuestions = mapTestResponceToQuestion(started.session.tasks);
                    if (mappedQuestions.length === 0) {
                        setTestUnavailableKind("no-questions");
                    } else {
                        applySession(
                            started.session.sessionId,
                            started.session.sessionHash,
                            mappedQuestions,
                            started.session.remainingTime,
                            started.session.savedAnswers,
                        );
                    }
                } else {
                    setTestUnavailableKind("fetch-error");
                }
            } catch (error) {
                console.error("Error fetching test data:", error);
                setTestUnavailableKind("fetch-error");
            } finally {
                if (generation === fetchGenerationRef.current) {
                    setLoading(false);
                }
            }
        };

        void load();
    }, [assignmentId]);

    useEffect(() => {
        if (!completedOnServer || !assignmentId) {
            setCompletedGradeRow(undefined);
            return;
        }
        if (!subjectId) {
            setCompletedGradeRow(null);
            return;
        }
        let cancelled = false;
        setCompletedGradeRow(undefined);
        void (async () => {
            try {
                const rows = await StudentGrades.getAssignmentsForSubject(subjectId);
                if (cancelled) return;
                const row = rows?.find((g) => String(g.assignmentId) === String(assignmentId));
                setCompletedGradeRow(row ?? null);
            } catch {
                if (!cancelled) setCompletedGradeRow(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [completedOnServer, subjectId, assignmentId]);

    const buildAnswerPayload = useCallback((): SendTestAnswers | null => {
        if (!assignmentId) return null;

        const answerVariants: AnswerVariant[] = questions.map((question) => {
            const stored = answers[question.id];
            const raw = stored?.guid;

            if (question.type === "open") {
                const text = typeof raw === "string" ? raw : "";
                return {
                    taskVariantId: question.guid,
                    answer: text,
                    taskOptionIds: null,
                };
            }

            const ids = Array.isArray(raw) ? raw.map(String) : raw != null && raw !== "" ? [String(raw)] : [];
            return {
                taskVariantId: question.guid,
                answer: null,
                taskOptionIds: ids.length > 0 ? ids : null,
            };
        });

        return { assignmentId, answerVariants };
    }, [assignmentId, answers, questions]);

    const submitTestAndExit = useCallback(async () => {
        if (!assignmentId || completedOnServer) return;

        const payload = buildAnswerPayload();
        if (!payload) return;

        allowNavigationRef.current = true;
        try {
            await Assignment.uploadStudentAnswers(payload);
            clearTimedTestSessionCache(assignmentId);
            if (blockerRef.current?.state === "blocked") {
                blockerRef.current.reset();
            }
            const target = subjectId ? `/subject/${subjectId}` : "/dashboard";
            window.location.assign(target);
        } catch (error) {
            allowNavigationRef.current = false;
            console.error(error);
            throw error;
        }
    }, [assignmentId, buildAnswerPayload, completedOnServer, subjectId]);

    useEffect(() => {
        if (completedOnServer || loading || !assignmentId || questions.length === 0) return;

        if (saveProgressTimerRef.current) {
            clearTimeout(saveProgressTimerRef.current);
        }

        saveProgressTimerRef.current = setTimeout(() => {
            const payload = buildAnswerPayload();
            if (!payload) return;
            const hasAny = payload.answerVariants.some(
                (variant) =>
                    (variant.answer != null && variant.answer.trim() !== "") ||
                    (variant.taskOptionIds != null && variant.taskOptionIds.length > 0),
            );
            if (!hasAny) return;
            void Assignment.saveTimedTestProgress(payload);
        }, 700);

        return () => {
            if (saveProgressTimerRef.current) {
                clearTimeout(saveProgressTimerRef.current);
            }
        };
    }, [answers, assignmentId, buildAnswerPayload, completedOnServer, loading, questions]);

    useEffect(() => {
        const question = questions[currentQuestionIndex];
        if (!question) return;
        setSelectedOptions(selectedLabelsForQuestion(question, answers[question.id]));
    }, [currentQuestionIndex, questions, answers]);

    const exitTestUnavailableView = useCallback(() => {
        allowNavigationRef.current = true;
        if (blockerRef.current?.state === "blocked") {
            blockerRef.current.reset();
        }
        navigate(subjectId ? `/subject/${subjectId}` : "/subjects");
    }, [navigate, subjectId]);

    const handleBoxClick = (option: string, isMulti: boolean, quid: string) => {
        if (completedOnServer) return;
        if (isMulti) {
            setSelectedOptions((prev) => {
                if (prev.includes(option)) {
                    return prev.filter((o) => o !== option);
                }
                return [...prev, option];
            });
        } else {
            handleChange(questions[currentQuestionIndex].id, option);
            setSelectedOptions([option]);
        }
    };

    useEffect(() => {
        const opts = questions[currentQuestionIndex]?.options;
        if (selectedOptions.length > 0 && opts) {
            const matchingOptions = opts.filter((option) => selectedOptions.includes(option.label));
            handleChange(
                questions[currentQuestionIndex].id,
                matchingOptions.map((option) => option.id),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors existing behavior; selectedOptions drives sync
    }, [selectedOptions]);

    const handleNextQuestion = (index: number) => () => {
        if (completedOnServer) return;
        setCurrentQuestionIndex(index);
    };

    const handleLeaveDialogCancel = () => {
        setLeaveDialogOpen(false);
        if (blockerRef.current?.state === "blocked") {
            blockerRef.current.reset();
        }
    };

    const handleLeaveDialogConfirm = async () => {
        try {
            await submitTestAndExit();
            setLeaveDialogOpen(false);
        } catch {
            /* submitTestAndExit logs; keep user on test */
        }
    };

    const handleSubmitDialogConfirm = async () => {
        try {
            await submitTestAndExit();
            setSubmitDialogOpen(false);
        } catch {
            /* submitTestAndExit logs */
        }
    };

    const handleChange = (questionId: number, guid: string | string[]) => {
        if (completedOnServer) return;
        const updatedAnswer: Answer = { guid };
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionId]: updatedAnswer,
        }));
    };

    if (!assignmentId) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Typography color="text.secondary">Missing assignment.</Typography>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <CircularProgress sx={{ color: PURPLE }} />
            </Box>
        );
    }

    if (completedOnServer) {
        return (
            <div className={shell.pageShell}>
                <PageHeader user={user} />
                <div className={shell.pageBody}>
                    <ButtonsMenu activeView="subjects" user={user} />
                    <div className={shell.mainScroll}>
                        <Box sx={{ p: 4, maxWidth: 560, mx: "auto" }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Test completed
                            </Typography>
                            {completedGradeRow === undefined ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                                    <CircularProgress size={22} sx={{ color: PURPLE }} />
                                    <Typography color="text.secondary">Loading your result…</Typography>
                                </Box>
                            ) : completedGradeRow === null ? (
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    You have already submitted this test. You cannot change your answers.
                                </Typography>
                            ) : completedGradeRow.pointsEarned != null ? (
                                <>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: PURPLE, mb: 1 }}>
                                        Your score: {completedGradeRow.pointsEarned}/{completedGradeRow.maxPoints}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        You have already submitted this test. You cannot change your answers.
                                    </Typography>
                                </>
                            ) : (
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    You have already submitted this test. You cannot change your answers. Your final score
                                    will show here once grading is complete (including any open-ended questions).
                                </Typography>
                            )}
                            <Button
                                variant="contained"
                                onClick={() =>
                                    subjectId ? navigate(`/subject/${subjectId}`) : navigate("/dashboard")
                                }
                                sx={{ bgcolor: PURPLE, "&:hover": { bgcolor: PURPLE_HOVER } }}
                            >
                                {subjectId ? "Back to subject" : "Back to dashboard"}
                            </Button>
                        </Box>
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        const isNoQuestions = testUnavailableKind === "no-questions";
        const title = isNoQuestions ? "This test has no questions" : "No questions loaded";
        const description = isNoQuestions
            ? "This assignment does not include any test questions. You can return to the subject page."
            : "This test could not be loaded (for example, the assignment may be missing or unavailable). Return to the subject and try again.";

        return (
            <div className={shell.pageShell}>
                <PageHeader user={user} />
                <div className={shell.pageBody}>
                    <ButtonsMenu activeView="subjects" user={user} />
                    <div className={shell.mainScroll}>
                        <Box sx={{ p: 4, maxWidth: 560, mx: "auto" }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                {title}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                {description}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={exitTestUnavailableView}
                                sx={{ bgcolor: PURPLE, "&:hover": { bgcolor: PURPLE_HOVER } }}
                            >
                                {subjectId ? "Back to subject" : "Back to subjects"}
                            </Button>
                        </Box>
                    </div>
                </div>
            </div>
        );
    }

    const safeIndex = currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? currentQuestionIndex : 0;
    const currentQ = questions[safeIndex];

    return (
        <div className={shell.pageShell} key={assignmentId}>
            <TestSessionModal
                open={leaveDialogOpen}
                variant="leave"
                onClose={handleLeaveDialogCancel}
                onConfirm={handleLeaveDialogConfirm}
            />
            <TestSessionModal
                open={submitDialogOpen}
                variant="submit"
                onClose={() => setSubmitDialogOpen(false)}
                onConfirm={handleSubmitDialogConfirm}
            />
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="subjects" user={user} />
                <div className={shell.mainScroll}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", px: { xs: 2, md: 3 }, pt: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => setLeaveDialogOpen(true)}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                        >
                            Leave test
                        </Button>
                    </Box>
                    <div className={styles.layout}>
                        <div className={styles.main}>
                            <div className={styles.questionCard}>
                                <Typography
                                    variant="overline"
                                    sx={{ color: "#6b7280", fontWeight: 700, letterSpacing: "0.08em", display: "block", mb: 1 }}
                                >
                                    Question {safeIndex + 1} of {questions.length}
                                </Typography>
                                <TestMathContent text={currentQ.question} variant="question" />
                            </div>

                            <QuestionRenderer
                                question={currentQ}
                                selectedOptions={selectedOptions}
                                handleBoxClick={handleBoxClick}
                                handleChange={handleChange}
                                answers={answers}
                            />

                            <div className={styles.actions}>
                                <Button
                                    variant="outlined"
                                    onClick={handleNextQuestion(safeIndex - 1)}
                                    disabled={safeIndex === 0}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 700,
                                        borderRadius: "10px",
                                        px: 2.5,
                                        borderColor: "rgba(212, 26, 109, 0.45)",
                                        color: "#d41a6d",
                                        "&:hover": { borderColor: "#d41a6d", backgroundColor: "rgba(212, 26, 109, 0.06)" },
                                    }}
                                >
                                    Previous question
                                </Button>
                                {safeIndex < questions.length - 1 ? (
                                    <Button
                                        variant="contained"
                                        onClick={handleNextQuestion(safeIndex + 1)}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: "10px",
                                            px: 2.5,
                                            bgcolor: PURPLE,
                                            boxShadow: "none",
                                            "&:hover": { bgcolor: PURPLE_HOVER, boxShadow: "none" },
                                        }}
                                    >
                                        Next question
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={() => setSubmitDialogOpen(true)}
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 700,
                                            borderRadius: "10px",
                                            px: 2.5,
                                            bgcolor: PURPLE,
                                            boxShadow: "none",
                                            "&:hover": { bgcolor: PURPLE_HOVER, boxShadow: "none" },
                                        }}
                                    >
                                        Finish test
                                    </Button>
                                )}
                            </div>
                        </div>

                        <aside className={styles.sidebar}>
                            {sessionId && sessionHash ? (
                                <CountdownTimer
                                    assignmentId={assignmentId}
                                    sessionId={sessionId}
                                    sessionHash={sessionHash}
                                    initialSeconds={initialTimerSeconds}
                                />
                            ) : null}
                            <div className={styles.navPills}>
                                {questions.map((question, index) => {
                                    const answered = Boolean(answers[question.id]);
                                    return (
                                        <button
                                            type="button"
                                            key={question.guid}
                                            className={`${styles.navPill} ${index === safeIndex ? styles.navPillActive : ""}`}
                                            onClick={handleNextQuestion(index)}
                                            aria-label={`Go to question ${index + 1}`}
                                            aria-current={index === safeIndex ? "true" : undefined}
                                        >
                                            {index + 1}
                                            {answered ? (
                                                <span
                                                    style={{
                                                        position: "absolute",
                                                        bottom: 4,
                                                        left: "50%",
                                                        transform: "translateX(-50%)",
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        background: "#10b981",
                                                    }}
                                                    aria-hidden
                                                />
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentTaskPage;
