import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import shell from "../../layouts/AuthenticatedShell.module.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import Assignment from "../../api/Assignment";
import Lecture from "../../api/Lecture";
import useNotification from "../../hooks/useNotification";
import type { HomeworkGradingOverviewResponse } from "../../api/models/response/HomeworkGradingOverviewResponse";
import type { HomeworkGradingDetailResponse } from "../../api/models/response/HomeworkGradingDetailResponse";
import { AssignmentKind } from "../../api/models/response/AssignmentResponse";
import styles from "./GradeHomeworkPage.module.css";

function statusChipClass(status: string): string {
    if (status === "graded") return styles.chipGraded;
    if (status === "needs_grading") return styles.chipPending;
    return styles.chipNotSubmitted;
}

function statusLabel(status: string): string {
    if (status === "graded") return "Graded";
    if (status === "needs_grading") return "Needs grading";
    return "Not submitted";
}

function FileGlyph({ fileName }: { fileName: string }) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) {
        return <PictureAsPdfOutlinedIcon className={styles.sectionIconPrimary} aria-hidden />;
    }
    if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".7z")) {
        return <FolderZipOutlinedIcon className={styles.sectionIconPrimary} aria-hidden />;
    }
    return <InsertDriveFileOutlinedIcon className={styles.sectionIconPrimary} aria-hidden />;
}

const GradeHomeworkPage = () => {
    const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();

    const [user, setUser] = useState<UserResponse | undefined>();
    const [authReady, setAuthReady] = useState(false);
    const [overview, setOverview] = useState<HomeworkGradingOverviewResponse | undefined>();
    const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
    const [detail, setDetail] = useState<HomeworkGradingDetailResponse | undefined>();
    const [scoreInput, setScoreInput] = useState("");
    const [feedbackInput, setFeedbackInput] = useState("");
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        User.me()
            .then(setUser)
            .catch(() => setUser(undefined))
            .finally(() => setAuthReady(true));
    }, []);

    const loadOverview = useCallback(async () => {
        if (!assignmentId) return;
        setLoadingOverview(true);
        try {
            const assignment = await Assignment.getAssignment(assignmentId);
            if (!assignment || assignment.kind !== AssignmentKind.Homework) {
                notifyError("This page is only for homework assignments.");
                navigate(subjectId ? `/subject/${subjectId}` : "/subjects");
                return;
            }
            const o = await Assignment.getHomeworkGradingOverview(assignmentId);
            if (!o) {
                notifyError("Could not load grading data. Are you signed in as the teacher?");
                navigate(subjectId ? `/subject/${subjectId}` : "/subjects");
                return;
            }
            setOverview(o);
            setSelectedStudentId((prev) => {
                if (prev && o.students.some((s) => s.studentId === prev)) return prev;
                const pending = o.students.find((s) => s.status === "needs_grading");
                return pending?.studentId ?? o.students[0]?.studentId;
            });
        } finally {
            setLoadingOverview(false);
        }
    }, [assignmentId, subjectId, navigate, notifyError]);

    useEffect(() => {
        if (!authReady) return;
        if (user?.role?.toLowerCase() !== "teacher") return;
        void loadOverview();
    }, [authReady, user, loadOverview]);

    useEffect(() => {
        if (!authReady || user?.role?.toLowerCase() !== "teacher") return;
        if (!assignmentId || !selectedStudentId) {
            setDetail(undefined);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoadingDetail(true);
            const d = await Assignment.getHomeworkGradingDetail(assignmentId, selectedStudentId);
            if (!cancelled) {
                setDetail(d);
                if (d) {
                    setScoreInput(d.teacherScore != null && d.teacherScore !== undefined ? String(d.teacherScore) : "");
                    setFeedbackInput(d.teacherFeedback ?? "");
                }
            }
            if (!cancelled) setLoadingDetail(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [authReady, user, assignmentId, selectedStudentId]);

    const percentageLabel = useMemo(() => {
        const max = overview?.maxMark ?? detail?.maxMark ?? 0;
        const raw = scoreInput.trim().replace(",", ".");
        const n = Number(raw);
        if (!max || Number.isNaN(n)) return "—%";
        const pct = Math.round((n / max) * 1000) / 10;
        return `${pct}%`;
    }, [scoreInput, overview?.maxMark, detail?.maxMark]);

    const handleSubmitGrade = async () => {
        if (!assignmentId || !selectedStudentId || !overview) return;
        const max = overview.maxMark;
        const raw = scoreInput.trim().replace(",", ".");
        const score = Number(raw);
        if (Number.isNaN(score)) {
            notifyError("Enter a valid score.");
            return;
        }
        if (score < 0 || score > max + 1e-9) {
            notifyError(`Score must be between 0 and ${max}.`);
            return;
        }
        setSubmitting(true);
        try {
            const updated = await Assignment.gradeHomeworkSubmission(assignmentId, selectedStudentId, {
                score,
                teacherFeedback: feedbackInput.trim() || null,
            });
            if (updated) {
                setDetail(updated);
                notifySuccess("Grade saved.");
                await loadOverview();
            } else {
                notifyError("Could not save grade.");
            }
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

    if (loadingOverview || !overview) {
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

                        <div className={styles.layout}>
                            <aside>
                                <Typography className={styles.sidebarTitle}>
                                    Students ({overview.students.length})
                                </Typography>
                                <div className={styles.studentList}>
                                    {overview.students.map((s) => (
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
                                                <span className={[styles.chip, statusChipClass(s.status)].join(" ")}>
                                                    {s.status === "graded" && (
                                                        <CheckCircleOutlineIcon className={styles.chipIcon} aria-hidden />
                                                    )}
                                                    {s.status === "needs_grading" && (
                                                        <PendingOutlinedIcon className={styles.chipIcon} aria-hidden />
                                                    )}
                                                    {s.status === "not_submitted" && (
                                                        <ErrorOutlineIcon className={styles.chipIcon} aria-hidden />
                                                    )}
                                                    {statusLabel(s.status)}
                                                </span>
                                            </div>
                                            {s.status === "graded" && s.score != null && (
                                                <span className={styles.studentScore}>
                                                    {s.score}/{overview.maxMark}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </aside>

                            <main>
                                <div className={styles.hero}>
                                    <h1 className={styles.heroTitle}>Grade Homework: {overview.assignmentTitle}</h1>
                                    <div className={styles.summaryChips}>
                                        <span className={[styles.summaryChip, styles.summaryChipMax].join(" ")}>
                                            <EmojiEventsOutlinedIcon className={styles.summaryIcon} aria-hidden />
                                            Max: {overview.maxMark} pts
                                        </span>
                                        <span className={[styles.summaryChip, styles.summaryChipGraded].join(" ")}>
                                            <CheckCircleOutlineIcon className={styles.summaryIcon} aria-hidden />
                                            {overview.gradedCount} graded
                                        </span>
                                        <span className={[styles.summaryChip, styles.summaryChipPending].join(" ")}>
                                            <PendingOutlinedIcon className={styles.summaryIcon} aria-hidden />
                                            {overview.pendingCount} pending
                                        </span>
                                        <span className={[styles.summaryChip, styles.summaryChipNone].join(" ")}>
                                            <ErrorOutlineIcon className={styles.summaryIcon} aria-hidden />
                                            {overview.notSubmittedCount} not submitted
                                        </span>
                                    </div>
                                </div>

                                {!selectedStudentId && (
                                    <Typography className={styles.emptyHint}>No students in this subject.</Typography>
                                )}

                                {loadingDetail && <CircularProgress size={28} />}

                                {!loadingDetail && detail && (
                                    <>
                                        <div className={styles.card}>
                                            <div className={styles.cardHeaderRow}>
                                                <div>
                                                    <h2 className={styles.profileName}>{detail.fullName}</h2>
                                                    <p className={styles.profileEmail}>{detail.email}</p>
                                                    {detail.updatedAt && (
                                                        <div className={styles.submittedLine}>
                                                            <ScheduleOutlinedIcon fontSize="small" color="action" />
                                                            <span>
                                                                Submitted: {new Date(detail.updatedAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span
                                                    className={[styles.chip, statusChipClass(detail.status)].join(" ")}
                                                >
                                                    {statusLabel(detail.status)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.card}>
                                            <div className={styles.sectionTitle}>
                                                <DescriptionOutlinedIcon className={styles.sectionIconPrimary} />
                                                Written Answer
                                            </div>
                                            <div className={styles.writtenBox}>
                                                {detail.studentComment?.trim()
                                                    ? detail.studentComment
                                                    : "— No written answer."}
                                            </div>
                                        </div>

                                        <div className={styles.card}>
                                            <div className={styles.sectionTitle}>
                                                <AttachFileIcon className={styles.sectionIconGreen} />
                                                Submitted Files
                                            </div>
                                            {detail.attachments.length === 0 ? (
                                                <Typography color="text.secondary">No files attached.</Typography>
                                            ) : (
                                                <div className={styles.fileList}>
                                                    {detail.attachments.map((a) => (
                                                        <div key={a.id} className={styles.fileRow}>
                                                            <FileGlyph fileName={a.fileName} />
                                                            <a
                                                                className={styles.fileLink}
                                                                href={Lecture.fileUrl(a.downloadUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {a.fileName}
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.gradingCard}>
                                            <h3 className={styles.gradingTitle}>Grading</h3>
                                            <div className={styles.scoreRow}>
                                                <div>
                                                    <label className={styles.fieldLabel} htmlFor="gh-score">
                                                        Score (max {overview.maxMark} pts)
                                                    </label>
                                                    <TextField
                                                        id="gh-score"
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Enter score"
                                                        value={scoreInput}
                                                        onChange={(e) => setScoreInput(e.target.value)}
                                                        className={styles.input}
                                                    />
                                                </div>
                                                <div className={styles.percentBox}>
                                                    <div className={styles.percentLabel}>Percentage</div>
                                                    <div className={styles.percentValue}>{percentageLabel}</div>
                                                </div>
                                            </div>
                                            <div className={styles.feedbackField}>
                                                <label className={styles.fieldLabel} htmlFor="gh-feedback">
                                                    Feedback for Student
                                                </label>
                                                <TextField
                                                    id="gh-feedback"
                                                    fullWidth
                                                    multiline
                                                    minRows={4}
                                                    placeholder="Provide feedback on the submission..."
                                                    value={feedbackInput}
                                                    onChange={(e) => setFeedbackInput(e.target.value)}
                                                    className={styles.input}
                                                />
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
                                                onClick={() => void handleSubmitGrade()}
                                            >
                                                Submit Grade & Feedback
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </main>
                        </div>
                    </Box>
                </Box>
            </div>
        </div>
    );
};

export default GradeHomeworkPage;
