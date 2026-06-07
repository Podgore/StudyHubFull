import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import shell from "../../layouts/AuthenticatedShell.module.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import Assignment from "../../api/Assignment";
import useNotification from "../../hooks/useNotification";
import type { OpenEndedSubmissionResponse } from "../../api/models/response/OpenEndedSubmissionResponse";
import { AssignmentKind } from "../../api/models/response/AssignmentResponse";
import styles from "./GradeOpenEndedPage.module.css";

type DraftEntry = { score: string; feedback: string };

type StudentAgg = {
    studentId: string;
    fullName: string;
    email: string;
    rows: OpenEndedSubmissionResponse[];
    totalMax: number;
    totalAwarded: number;
    status: "graded" | "needs_grading";
};

function aggregateStudents(rows: OpenEndedSubmissionResponse[]): StudentAgg[] {
    const map = new Map<string, StudentAgg>();
    for (const r of rows) {
        let g = map.get(r.studentId);
        if (!g) {
            g = {
                studentId: r.studentId,
                fullName: r.studentFullName,
                email: r.studentEmail ?? "",
                rows: [],
                totalMax: 0,
                totalAwarded: 0,
                status: "needs_grading",
            };
            map.set(r.studentId, g);
        }
        g.rows.push(r);
    }
    const list = [...map.values()].map((g) => {
        const totalMax = g.rows.reduce((s, x) => s + x.maxMark, 0);
        const totalAwarded = g.rows.reduce((s, x) => s + x.awardedMark, 0);
        const reviewed = g.rows.length > 0 && g.rows.every((x) => x.reviewedByTeacher);
        return {
            ...g,
            totalMax,
            totalAwarded,
            status: reviewed ? ("graded" as const) : ("needs_grading" as const),
        };
    });
    list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    for (const g of list) {
        g.rows.sort((a, b) => a.questionLabel.localeCompare(b.questionLabel, undefined, { numeric: true }));
    }
    return list;
}

const GradeOpenEndedPage = () => {
    const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();

    const [user, setUser] = useState<UserResponse | undefined>();
    const [authReady, setAuthReady] = useState(false);
    const [assignmentTitle, setAssignmentTitle] = useState("");
    const [assignmentMaxMark, setAssignmentMaxMark] = useState(0);
    const [submissions, setSubmissions] = useState<OpenEndedSubmissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
    const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        User.me()
            .then(setUser)
            .catch(() => setUser(undefined))
            .finally(() => setAuthReady(true));
    }, []);

    const loadData = useCallback(async () => {
        if (!assignmentId) return;
        setLoading(true);
        try {
            const meta = await Assignment.getAssignment(assignmentId);
            if (!meta || meta.kind !== AssignmentKind.TimedTest) {
                notifyError("This page is only for timed tests with open-ended questions.");
                navigate(subjectId ? `/subject/${subjectId}` : "/subjects");
                return;
            }
            setAssignmentTitle(meta.title);
            setAssignmentMaxMark(meta.maxMark);
            const rows = await Assignment.getOpenEndedSubmissions(assignmentId);
            if (!rows) {
                notifyError("Could not load submissions.");
                navigate(subjectId ? `/subject/${subjectId}` : "/subjects");
                return;
            }
            setSubmissions(rows);
            setSelectedStudentId((prev) => {
                const students = aggregateStudents(rows);
                if (prev && students.some((s) => s.studentId === prev)) return prev;
                const pending = students.find((s) => s.status === "needs_grading");
                return pending?.studentId ?? students[0]?.studentId;
            });
        } finally {
            setLoading(false);
        }
    }, [assignmentId, subjectId, navigate, notifyError]);

    useEffect(() => {
        if (!authReady || user?.role?.toLowerCase() !== "teacher") return;
        void loadData();
    }, [authReady, user, loadData]);

    const students = useMemo(() => aggregateStudents(submissions), [submissions]);
    const openEndedQuestionCount = useMemo(
        () => new Set(submissions.map((r) => r.taskVariantId)).size,
        [submissions],
    );
    const gradedStudentCount = useMemo(() => students.filter((s) => s.status === "graded").length, [students]);
    const pendingStudentCount = useMemo(() => students.filter((s) => s.status === "needs_grading").length, [students]);

    const selected = useMemo(
        () => students.find((s) => s.studentId === selectedStudentId),
        [students, selectedStudentId],
    );

    useEffect(() => {
        if (!selected) {
            setDrafts({});
            return;
        }
        const next: Record<string, DraftEntry> = {};
        for (const r of selected.rows) {
            next[r.studentAnswerId] = {
                score: String(r.awardedMark),
                feedback: r.teacherFeedback ?? "",
            };
        }
        setDrafts(next);
    }, [selected]);

    const footerTotals = useMemo(() => {
        if (!selected) return { sum: 0, max: 0, pct: 0 };
        let sum = 0;
        for (const r of selected.rows) {
            const d = drafts[r.studentAnswerId];
            const raw = (d?.score ?? "").trim().replace(",", ".");
            const n = Number(raw);
            if (!Number.isNaN(n)) sum += n;
        }
        const max = selected.totalMax;
        const pct = max > 0 ? Math.round((sum / max) * 1000) / 10 : 0;
        return { sum, max, pct };
    }, [selected, drafts]);

    const handleDraftChange = (studentAnswerId: string, field: keyof DraftEntry, value: string) => {
        setDrafts((prev) => {
            const cur = prev[studentAnswerId] ?? { score: "", feedback: "" };
            return {
                ...prev,
                [studentAnswerId]: {
                    score: field === "score" ? value : cur.score,
                    feedback: field === "feedback" ? value : cur.feedback,
                },
            };
        });
    };

    const handleSubmitAll = async () => {
        if (!selected) return;
        const payloads: { id: string; mark: number; feedback: string | null }[] = [];
        for (const r of selected.rows) {
            const d = drafts[r.studentAnswerId];
            const raw = (d?.score ?? "").trim().replace(",", ".");
            const mark = Number(raw);
            if (Number.isNaN(mark)) {
                notifyError(`Enter a valid score for "${r.questionLabel}".`);
                return;
            }
            if (mark < 0 || mark > r.maxMark + 1e-9) {
                notifyError(`Score for "${r.questionLabel}" must be between 0 and ${r.maxMark}.`);
                return;
            }
            const fb = (d?.feedback ?? "").trim();
            payloads.push({ id: r.studentAnswerId, mark, feedback: fb.length ? fb : null });
        }
        setSubmitting(true);
        try {
            const results = await Promise.all(
                payloads.map((p) =>
                    Assignment.setOpenEndedMark({
                        studentAnswerId: p.id,
                        mark: p.mark,
                        feedback: p.feedback,
                    }),
                ),
            );
            if (results.some((ok) => !ok)) {
                notifyError("Some marks could not be saved.");
            } else {
                notifySuccess("All grades saved.");
            }
            await loadData();
        } finally {
            setSubmitting(false);
        }
    };

    if (!authReady) {
        return (
            <div className={shell.pageShell}>
                <PageHeader user={user} />
                <div className={shell.pageBody}>
                    <ButtonsMenu activeView="subjects" user={user} />
                    <Box className={shell.mainScroll}>
                        <Box className={styles.scroll}>
                            <CircularProgress />
                        </Box>
                    </Box>
                </div>
            </div>
        );
    }

    if (!user || user.role?.toLowerCase() !== "teacher") {
        return (
            <div className={shell.pageShell}>
                <PageHeader user={user} />
                <div className={shell.pageBody}>
                    <ButtonsMenu activeView="subjects" user={user} />
                    <Box className={shell.mainScroll}>
                        <Box className={styles.scroll}>
                            <Typography>Only teachers can open this page.</Typography>
                            <Button component={RouterLink} to={subjectId ? `/subject/${subjectId}` : "/subjects"}>
                                Go back
                            </Button>
                        </Box>
                    </Box>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={shell.pageShell}>
                <PageHeader user={user} />
                <div className={shell.pageBody}>
                    <ButtonsMenu activeView="subjects" user={user} />
                    <Box className={shell.mainScroll}>
                        <Box className={styles.scroll}>
                            <CircularProgress />
                        </Box>
                    </Box>
                </div>
            </div>
        );
    }

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="subjects" user={user} />
                <Box className={shell.mainScroll}>
                    <Box className={styles.scroll}>
                        <Button
                            component={RouterLink}
                            to={subjectId ? `/subject/${subjectId}` : "/subjects"}
                            startIcon={<ArrowBackIcon />}
                            className={styles.backBtn}
                        >
                            Back to subject
                        </Button>

                        {submissions.length === 0 ? (
                            <Typography className={styles.emptyHint}>
                                No open-ended answers to grade for this assignment (or students have not submitted yet).
                            </Typography>
                        ) : (
                            <div className={styles.layout}>
                                <aside>
                                    <Typography className={styles.sidebarTitle}>Students ({students.length})</Typography>
                                    <div className={styles.studentList}>
                                        {students.map((s) => (
                                            <button
                                                key={s.studentId}
                                                type="button"
                                                className={[
                                                    styles.studentCard,
                                                    s.studentId === selectedStudentId ? styles.studentCardSelected : "",
                                                ].join(" ")}
                                                onClick={() => setSelectedStudentId(s.studentId)}
                                            >
                                                <PersonOutlineIcon color="action" />
                                                <div className={styles.studentMeta}>
                                                    <div className={styles.studentName}>{s.fullName}</div>
                                                    <span
                                                        className={[
                                                            styles.chip,
                                                            s.status === "graded" ? styles.chipGraded : styles.chipPending,
                                                        ].join(" ")}
                                                    >
                                                        {s.status === "graded" ? (
                                                            <CheckCircleOutlineIcon className={styles.chipIcon} aria-hidden />
                                                        ) : (
                                                            <PendingOutlinedIcon className={styles.chipIcon} aria-hidden />
                                                        )}
                                                        {s.status === "graded" ? "Graded" : "Needs grading"}
                                                    </span>
                                                </div>
                                                <div className={styles.metaRight}>
                                                    {s.status === "graded" ? (
                                                        <div className={styles.scoreSummary}>
                                                            Score: {s.totalAwarded.toFixed(2)}/{s.totalMax}
                                                        </div>
                                                    ) : (
                                                        <div className={styles.progressText}>
                                                            Progress:{" "}
                                                            {s.totalMax > 0
                                                                ? `${Math.round((s.totalAwarded / s.totalMax) * 100)}%`
                                                                : "0%"}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </aside>

                                <main>
                                    <div className={styles.hero}>
                                        <h1 className={styles.heroTitle}>Grade Test: {assignmentTitle}</h1>
                                        <div className={styles.summaryChips}>
                                            <span className={[styles.summaryChip, styles.summaryMax].join(" ")}>
                                                <EmojiEventsOutlinedIcon className={styles.summaryIcon} aria-hidden />
                                                Max: {assignmentMaxMark} pts
                                            </span>
                                            <span className={[styles.summaryChip, styles.summaryInfo].join(" ")}>
                                                <DescriptionOutlinedIcon className={styles.summaryIcon} aria-hidden />
                                                {openEndedQuestionCount} open-ended question
                                                {openEndedQuestionCount === 1 ? "" : "s"}
                                            </span>
                                            <span className={[styles.summaryChip, styles.summaryGraded].join(" ")}>
                                                <CheckCircleOutlineIcon className={styles.summaryIcon} aria-hidden />
                                                {gradedStudentCount} graded
                                            </span>
                                            <span className={[styles.summaryChip, styles.summaryPending].join(" ")}>
                                                <PendingOutlinedIcon className={styles.summaryIcon} aria-hidden />
                                                {pendingStudentCount} pending
                                            </span>
                                        </div>
                                    </div>

                                    {selected && (
                                        <>
                                            <div className={styles.profileCard}>
                                                <div className={styles.profileMain}>
                                                    <h2 className={styles.profileName}>{selected.fullName}</h2>
                                                    <p className={styles.profileEmail}>{selected.email}</p>
                                                    {selected.rows[0] && (
                                                        <div className={styles.submittedLine}>
                                                            <ScheduleOutlinedIcon fontSize="small" color="action" />
                                                            <span>Review open-ended responses for this student.</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.totalBox}>
                                                    <div className={styles.totalLabel}>Total Score</div>
                                                    <div className={styles.totalValue}>
                                                        {footerTotals.sum.toFixed(2)}/{selected.totalMax}
                                                    </div>
                                                </div>
                                            </div>

                                            {selected.rows.map((r, idx) => (
                                                <div key={r.studentAnswerId} className={styles.questionCard}>
                                                    <div className={styles.questionHeader}>
                                                        <span className={styles.qChip}>Question {idx + 1}</span>
                                                        <span className={styles.pointsLabel}>{r.maxMark} points</span>
                                                    </div>
                                                    <p className={styles.questionStem}>{r.questionLabel}</p>
                                                    {r.referenceHint && (
                                                        <div className={styles.referenceBlock}>
                                                            <strong>Reference / rubric:</strong>
                                                            <div className={styles.referenceBody}>{r.referenceHint}</div>
                                                        </div>
                                                    )}
                                                    <div className={styles.answerLabel}>{"Student's Answer"}</div>
                                                    <div className={styles.answerBox}>
                                                        {r.studentResponse?.trim() ? r.studentResponse : "— (empty)"}
                                                    </div>
                                                    <div className={styles.gradingInset}>
                                                        <div className={styles.gradingRow}>
                                                            <div>
                                                                <label
                                                                    className={styles.fieldLabel}
                                                                    htmlFor={`score-${r.studentAnswerId}`}
                                                                >
                                                                    Score (max {r.maxMark} pts)
                                                                </label>
                                                                <TextField
                                                                    id={`score-${r.studentAnswerId}`}
                                                                    size="small"
                                                                    fullWidth
                                                                    placeholder="Enter score"
                                                                    value={drafts[r.studentAnswerId]?.score ?? ""}
                                                                    onChange={(e) =>
                                                                        handleDraftChange(r.studentAnswerId, "score", e.target.value)
                                                                    }
                                                                    className={styles.input}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label
                                                                    className={styles.fieldLabel}
                                                                    htmlFor={`fb-${r.studentAnswerId}`}
                                                                >
                                                                    Feedback
                                                                </label>
                                                                <TextField
                                                                    id={`fb-${r.studentAnswerId}`}
                                                                    size="small"
                                                                    fullWidth
                                                                    placeholder="Optional feedback…"
                                                                    value={drafts[r.studentAnswerId]?.feedback ?? ""}
                                                                    onChange={(e) =>
                                                                        handleDraftChange(r.studentAnswerId, "feedback", e.target.value)
                                                                    }
                                                                    className={styles.input}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className={styles.footerBar}>
                                                <div>
                                                    <div className={styles.footerText}>Ready to submit?</div>
                                                    <div className={styles.footerSub}>
                                                        Total Score: {footerTotals.sum.toFixed(2)}/{selected.totalMax} (
                                                        {footerTotals.pct}%)
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="contained"
                                                    className={styles.submitBtn}
                                                    disabled={submitting}
                                                    startIcon={
                                                        submitting ? (
                                                            <CircularProgress size={18} color="inherit" />
                                                        ) : (
                                                            <SendOutlinedIcon />
                                                        )
                                                    }
                                                    onClick={() => void handleSubmitAll()}
                                                >
                                                    Submit All Grades
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </main>
                            </div>
                        )}
                    </Box>
                </Box>
            </div>
        </div>
    );
};

export default GradeOpenEndedPage;
