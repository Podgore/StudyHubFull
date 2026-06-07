import { useCallback, useEffect, useState } from "react";
import { Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import shell from "../../layouts/AuthenticatedShell.module.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import AssignmentHeroChips from "./components/AssignmentHeroChips";
import CourseTaskLoading from "./components/CourseTaskLoading";
import InstructionsSection from "./components/InstructionsSection";
import MaterialsSection from "./components/MaterialsSection";
import SectionCard from "./components/SectionCard";
import StudentSubmissionPanel from "./components/StudentSubmissionPanel";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import Assignment from "../../api/Assignment";
import AssignmentResponse, { AssignmentKind } from "../../api/models/response/AssignmentResponse";
import useNotification from "../../hooks/useNotification";
import type { HomeworkSubmissionResponse } from "../../api/models/response/HomeworkSubmissionResponse";
import styles from "./CourseTaskPage.module.css";

function homeworkCanEditFromAssignment(a: AssignmentResponse): boolean {
    const now = Date.now();
    const open = new Date(a.openingDate).getTime();
    const close = new Date(a.closingDate).getTime();
    return now >= open && now <= close;
}

const CourseTaskPage = () => {
    const { subjectId, assignmentId } = useParams<{ subjectId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();
    const [user, setUser] = useState<UserResponse | undefined>();
    const [assignment, setAssignment] = useState<AssignmentResponse | undefined>();
    const [uploadingTeacherMaterial, setUploadingTeacherMaterial] = useState(false);
    const [homeworkSubmission, setHomeworkSubmission] = useState<HomeworkSubmissionResponse | undefined>();
    const [draftComment, setDraftComment] = useState("");
    const [loadingSubmission, setLoadingSubmission] = useState(false);
    const [savingComment, setSavingComment] = useState(false);
    const [uploadingStudentFile, setUploadingStudentFile] = useState(false);

    const load = useCallback(async () => {
        if (!assignmentId) return;
        const a = await Assignment.getAssignment(assignmentId);
        if (!a) {
            notifyError("Assignment not found.");
            return;
        }
        if ((a.kind ?? AssignmentKind.TimedTest) !== AssignmentKind.Homework) {
            notifyError("This page is only for homework tasks.");
            navigate(`/subject/${subjectId}`);
            return;
        }
        setAssignment(a);
    }, [assignmentId, subjectId, navigate, notifyError]);

    useEffect(() => {
        User.me().then(setUser).catch(() => setUser(undefined));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const role = user?.role?.trim().toLowerCase() ?? "";
    const isTeacher = role === "teacher";
    const isStudent = role === "student";
    const userReady = user !== undefined;

    useEffect(() => {
        if (!assignmentId || !assignment || !userReady) {
            return;
        }
        if (!isStudent) {
            setHomeworkSubmission(undefined);
            setLoadingSubmission(false);
            return;
        }

        let cancelled = false;
        setHomeworkSubmission(undefined);
        setDraftComment("");
        setLoadingSubmission(true);
        (async () => {
            const s = await Assignment.getMyHomeworkSubmission(assignmentId);
            if (cancelled) return;
            if (s) {
                setHomeworkSubmission(s);
                setDraftComment(s.studentComment ?? "");
            } else {
                setHomeworkSubmission({
                    canEdit: homeworkCanEditFromAssignment(assignment),
                    attachments: [],
                    studentComment: null,
                    updatedAt: null,
                    teacherScore: null,
                    teacherFeedback: null,
                });
                setDraftComment("");
            }
            setLoadingSubmission(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [assignmentId, assignment, isStudent, userReady]);

    const refreshSubmission = useCallback(async () => {
        if (!assignmentId || !isStudent) return;
        const s = await Assignment.getMyHomeworkSubmission(assignmentId);
        if (s) {
            setHomeworkSubmission(s);
            setDraftComment(s.studentComment ?? "");
        }
    }, [assignmentId, isStudent]);

    const saveWrittenAnswer = async () => {
        if (!assignmentId || !homeworkSubmission?.canEdit) return;
        setSavingComment(true);
        try {
            const updated = await Assignment.updateHomeworkSubmissionComment(assignmentId, {
                studentComment: draftComment,
            });
            if (updated) {
                setHomeworkSubmission(updated);
                notifySuccess("Saved.");
            } else {
                notifyError("Could not save.");
            }
        } finally {
            setSavingComment(false);
        }
    };

    const handleTeacherMaterialFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !assignmentId) return;
        setUploadingTeacherMaterial(true);
        try {
            const created = await Assignment.uploadHomeworkAttachment(assignmentId, file);
            if (created) {
                notifySuccess("File uploaded.");
                await load();
            } else {
                notifyError("Upload failed.");
            }
        } finally {
            setUploadingTeacherMaterial(false);
        }
    };

    const removeTeacherMaterial = async (attachmentId: string) => {
        const ok = await Assignment.deleteHomeworkAttachment(attachmentId);
        if (ok) {
            notifySuccess("Attachment removed.");
            await load();
        } else {
            notifyError("Could not remove file.");
        }
    };

    const handleStudentSubmissionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !assignmentId) return;
        setUploadingStudentFile(true);
        try {
            const created = await Assignment.uploadStudentHomeworkAttachment(assignmentId, file);
            if (created) {
                notifySuccess("File added to your submission.");
                await refreshSubmission();
            } else {
                notifyError("Upload failed.");
            }
        } finally {
            setUploadingStudentFile(false);
        }
    };

    const removeStudentSubmissionFile = async (attachmentId: string) => {
        const ok = await Assignment.deleteStudentHomeworkAttachment(attachmentId);
        if (ok) {
            notifySuccess("File removed.");
            await refreshSubmission();
        } else {
            notifyError("Could not remove file.");
        }
    };

    if (!assignment) {
        return <CourseTaskLoading user={user} />;
    }

    const attachments = assignment.attachments ?? [];
    const openLabel = new Date(assignment.openingDate).toLocaleString();
    const dueLabel = new Date(assignment.closingDate).toLocaleString();

    const leftColumn = (
        <Stack spacing={2}>
            {assignment.lectureId && (
                <SectionCard icon={<MenuBookOutlinedIcon />} title="Related Lecture" tone="default">
                    <Button
                        component={RouterLink}
                        to={`/subject/${subjectId}/lecture/${assignment.lectureId}`}
                        variant="outlined"
                        startIcon={<InsertLinkOutlinedIcon />}
                        className={styles.lectureBtn}
                    >
                        {assignment.lectureTitle || "Open lecture"}
                    </Button>
                </SectionCard>
            )}

            <InstructionsSection assignment={assignment} isTeacher={isTeacher} onUpdated={() => void load()} />
            <MaterialsSection
                attachments={attachments}
                isTeacher={isTeacher}
                uploadingTeacherMaterial={uploadingTeacherMaterial}
                onUploadTeacherMaterial={handleTeacherMaterialFile}
                onRemoveTeacherMaterial={removeTeacherMaterial}
            />
        </Stack>
    );

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="subjects" user={user} />
                <Box
                    className={shell.mainScroll}
                    sx={(t) => ({
                        "--st-page-bg": "#f8f9fa",
                        "--st-back-hover-bg": alpha(t.palette.primary.main, 0.06),
                    })}
                >
                    <Box className={styles.scroll}>
                    <Box className={styles.content}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(`/subject/${subjectId}`)}
                            className={styles.backBtn}
                        >
                            Back to subject
                        </Button>

                        <Box className={styles.hero}>
                            <Typography variant="h4" sx={{ mb: 1 }}>
                                {assignment.title}
                            </Typography>
                            <Box className={styles.chipsRow}>
                                <AssignmentHeroChips
                                    openLabel={openLabel}
                                    dueLabel={dueLabel}
                                    maxMark={assignment.maxMark}
                                />
                            </Box>
                        </Box>

                        <Box className={styles.layoutGrid}>
                            <Box className={styles.leftCol}>{leftColumn}</Box>
                            {!userReady && (
                                <Box className={styles.rightCol} aria-hidden>
                                    <Paper elevation={0} className={styles.rightAsideSkeleton}>
                                        <Skeleton variant="rounded" width="55%" height={22} sx={{ mb: 2 }} />
                                        <Skeleton variant="rounded" width="100%" height={88} sx={{ mb: 1.5 }} />
                                        <Skeleton variant="rounded" width="100%" height={140} sx={{ mb: 2 }} />
                                        <Skeleton variant="rounded" width="70%" height={40} sx={{ mb: 2 }} />
                                        <Skeleton variant="rounded" width="100%" height={56} />
                                    </Paper>
                                </Box>
                            )}
                            {userReady && isStudent && (
                                <Box className={styles.rightCol}>
                                    <StudentSubmissionPanel
                                        isStudent={isStudent}
                                        assignmentMaxMark={assignment.maxMark}
                                        homeworkSubmission={homeworkSubmission}
                                        draftComment={draftComment}
                                        onDraftCommentChange={setDraftComment}
                                        loadingSubmission={loadingSubmission || homeworkSubmission === undefined}
                                        savingComment={savingComment}
                                        uploadingStudentFile={uploadingStudentFile}
                                        onSaveWrittenAnswer={saveWrittenAnswer}
                                        onUploadStudentSubmissionFile={handleStudentSubmissionFile}
                                        onRemoveStudentSubmissionFile={removeStudentSubmissionFile}
                                    />
                                </Box>
                            )}
                            {userReady && isTeacher && (
                                <Box className={styles.rightCol}>
                                    <Paper
                                        elevation={0}
                                        className={styles.teacherPanel}
                                        sx={(t) => ({
                                            "--st-panel-border": alpha(t.palette.primary.main, 0.45),
                                            "--st-panel-bg": alpha(t.palette.primary.main, 0.045),
                                            "--st-panel-shadow": `0 4px 24px ${alpha(t.palette.primary.main, 0.08)}`,
                                            "--st-header-border": alpha(t.palette.primary.main, 0.15),
                                            "--st-header-bg": alpha(t.palette.primary.main, 0.06),
                                        })}
                                    >
                                        <Box className={styles.teacherPanelHeader}>
                                            <RateReviewOutlinedIcon className={styles.teacherPanelHeaderIcon} />
                                            <Typography variant="subtitle1" className={styles.teacherPanelTitle}>
                                                Teacher actions
                                            </Typography>
                                        </Box>
                                        <Box className={styles.teacherPanelBody}>
                                            <Typography variant="body2" className={styles.teacherPanelHint}>
                                                Review what students turned in and assign marks for their written
                                                answers and uploaded files.
                                            </Typography>
                                            <Button
                                                component={RouterLink}
                                                to={`/subject/${subjectId}/homework-grade/${assignment.id}`}
                                                variant="contained"
                                                color="primary"
                                                startIcon={<RateReviewOutlinedIcon />}
                                                className={styles.gradeSubmissionsBtn}
                                                fullWidth
                                            >
                                                Grade submissions
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    </Box>
                    </Box>
                </Box>
            </div>
        </div>
    );
};

export default CourseTaskPage;
