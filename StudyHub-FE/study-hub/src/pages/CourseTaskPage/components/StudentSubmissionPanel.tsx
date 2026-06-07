import { Box, Button, CircularProgress, IconButton, Link as MuiLink, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import Lecture from "../../../api/Lecture";
import type { HomeworkSubmissionResponse } from "../../../api/models/response/HomeworkSubmissionResponse";
import styles from "./StudentSubmissionPanel.module.css";

export default function StudentSubmissionPanel(props: {
    isStudent: boolean;
    assignmentMaxMark: number;
    homeworkSubmission?: HomeworkSubmissionResponse;
    draftComment: string;
    onDraftCommentChange: (next: string) => void;
    loadingSubmission: boolean;
    savingComment: boolean;
    uploadingStudentFile: boolean;
    onSaveWrittenAnswer: () => void;
    onUploadStudentSubmissionFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveStudentSubmissionFile: (attachmentId: string) => void;
}) {
    if (!props.isStudent) return null;

    const sub = props.homeworkSubmission;
    const feedbackText = sub?.teacherFeedback?.trim() ?? "";
    const hasTeacherScore = sub != null && sub.teacherScore != null;
    const showGradingSection = hasTeacherScore || feedbackText.length > 0;

    return (
        <Paper
            elevation={0}
            className={styles.panel}
            sx={(t) => ({
                "--st-panel-border": alpha(t.palette.primary.main, 0.45),
                "--st-panel-bg": alpha(t.palette.primary.main, 0.045),
                "--st-panel-shadow": `0 4px 24px ${alpha(t.palette.primary.main, 0.08)}`,
                "--st-header-border": alpha(t.palette.primary.main, 0.15),
                "--st-header-bg": alpha(t.palette.primary.main, 0.06),
                "--st-save-hover-shadow": `0 4px 14px ${alpha(t.palette.primary.main, 0.35)}`,
                "--st-file-border": alpha(t.palette.divider, 0.9),
            })}
        >
            <Box className={styles.header}>
                <CheckBoxOutlinedIcon className={styles.headerIcon} />
                <Typography variant="subtitle1" className={styles.headerTitle}>
                    Your submission
                </Typography>
            </Box>
            <Box className={styles.body}>
                <Typography variant="body2" color="text.secondary" className={styles.intro}>
                    Add your written answer and attach solution files (PDF, documents, archives). This is separate from
                    materials your teacher shared above.
                </Typography>

                {props.loadingSubmission ? (
                    <Skeleton variant="rounded" height={160} className={styles.skeleton} />
                ) : (
                    <>
                        {props.homeworkSubmission && !props.homeworkSubmission.canEdit && (
                            <Typography variant="caption" display="block" className={styles.warning}>
                                The due date has passed or the task is not open — you can review what you turned in, but
                                editing is disabled.
                            </Typography>
                        )}

                        <TextField
                            label="Written answer / notes"
                            multiline
                            minRows={6}
                            fullWidth
                            value={props.draftComment}
                            onChange={(e) => props.onDraftCommentChange(e.target.value)}
                            disabled={!props.homeworkSubmission?.canEdit}
                            placeholder="Type your solution, explanations, or references here…"
                            className={styles.textField}
                            sx={{ mt: 2 }}
                        />

                        <Box className={styles.actions}>
                            <Button
                                variant="contained"
                                onClick={props.onSaveWrittenAnswer}
                                disabled={!props.homeworkSubmission?.canEdit || props.savingComment || props.loadingSubmission}
                                startIcon={
                                    props.savingComment ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        <SaveOutlinedIcon />
                                    )
                                }
                            >
                                {props.savingComment ? "Saving…" : "Save written answer"}
                            </Button>
                            {props.homeworkSubmission?.updatedAt && (
                                <Typography variant="caption" color="text.secondary">
                                    Last updated {new Date(props.homeworkSubmission.updatedAt).toLocaleString()}
                                </Typography>
                            )}
                        </Box>

                        <Typography variant="subtitle2" className={styles.filesTitle}>
                            Your files
                        </Typography>
                        {(props.homeworkSubmission?.attachments ?? []).length === 0 && (
                            <Typography variant="body2" color="text.secondary" className={styles.emptyFiles}>
                                No files attached to your submission yet.
                            </Typography>
                        )}
                        {(props.homeworkSubmission?.attachments ?? []).length > 0 && (
                            <Box className={styles.filesList}>
                                {(props.homeworkSubmission?.attachments ?? []).map((a) => (
                                    <Paper
                                        key={a.id}
                                        variant="outlined"
                                        className={styles.fileCard}
                                    >
                                        <Box className={styles.fileRow}>
                                            <InsertDriveFileOutlinedIcon color="action" />
                                            <MuiLink
                                                href={Lecture.fileUrl(a.downloadUrl)}
                                                target="_blank"
                                                rel="noopener"
                                                className={styles.fileLink}
                                            >
                                                {a.fileName}
                                            </MuiLink>
                                            {props.homeworkSubmission?.canEdit && (
                                                <IconButton
                                                    size="small"
                                                    aria-label="Remove file from submission"
                                                    onClick={() => props.onRemoveStudentSubmissionFile(a.id)}
                                                    className={styles.removeBtn}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        )}

                        {props.homeworkSubmission?.canEdit && (
                            <Box>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    color="primary"
                                    startIcon={<AttachFileIcon />}
                                    disabled={props.uploadingStudentFile}
                                    className={styles.attachBtn}
                                >
                                    {props.uploadingStudentFile ? "Uploading…" : "Attach file to submission"}
                                    <input type="file" hidden onChange={props.onUploadStudentSubmissionFile} />
                                </Button>
                                <Typography variant="caption" display="block" className={styles.hint}>
                                    Same allowed types as lecture materials (PDF, Office, images, zip, etc.).
                                </Typography>
                            </Box>
                        )}

                        {showGradingSection && (
                            <Box className={styles.gradingBlock}>
                                {hasTeacherScore && (
                                    <Typography className={styles.scoreBanner} component="div">
                                        Your score:{" "}
                                        <strong>
                                            {sub?.teacherScore} / {props.assignmentMaxMark} pts
                                        </strong>
                                    </Typography>
                                )}
                                {feedbackText.length > 0 && (
                                    <Box className={styles.feedbackBox}>
                                        <FeedbackOutlinedIcon className={styles.feedbackIcon} fontSize="small" />
                                        <div>
                                            <Typography component="div" className={styles.feedbackLabel}>
                                                Teacher feedback
                                            </Typography>
                                            <Typography component="div" className={styles.feedbackText}>
                                                {feedbackText}
                                            </Typography>
                                        </div>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                )}
            </Box>
        </Paper>
    );
}

