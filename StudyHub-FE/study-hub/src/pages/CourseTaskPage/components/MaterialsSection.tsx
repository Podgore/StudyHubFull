import { Box, Button, Divider, IconButton, Link as MuiLink, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import type { AssignmentAttachmentResponse } from "../../../api/models/response/AssignmentAttachmentResponse";
import Lecture from "../../../api/Lecture";
import SectionCard from "./SectionCard";
import styles from "./MaterialsSection.module.css";

export default function MaterialsSection(props: {
    attachments: AssignmentAttachmentResponse[];
    isTeacher: boolean;
    uploadingTeacherMaterial: boolean;
    onUploadTeacherMaterial: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveTeacherMaterial: (attachmentId: string) => void;
}) {
    const attachments = props.attachments ?? [];

    return (
        <SectionCard icon={<AttachFileIcon />} title="Materials" tone="materials">
            {attachments.length === 0 && (
                <Box
                    className={styles.emptyBox}
                    sx={(t) => ({
                        "--st-empty-border": alpha(t.palette.text.primary, 0.12),
                        "--st-empty-bg": alpha(t.palette.action.hover, 0.04),
                    })}
                >
                    <CloudUploadOutlinedIcon className={styles.emptyIcon} />
                    <Typography color="text.secondary" className={styles.emptyTitle}>
                        No files attached yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className={styles.emptySubtitle}>
                        {props.isTeacher
                            ? "Upload PDFs, documents, or archives for students to download."
                            : "Your teacher has not added downloadable materials for this task."}
                    </Typography>
                </Box>
            )}

            {attachments.length > 0 && (
                <Stack spacing={1} divider={<Divider flexItem className={styles.listDivider} />}>
                    {attachments.map((a) => (
                        <Box
                            key={a.id}
                            className={[
                                styles.fileRow,
                                a === attachments[0] ? styles.fileRowFirst : "",
                                a === attachments[attachments.length - 1] ? styles.fileRowLast : "",
                            ].join(" ")}
                        >
                            <InsertDriveFileOutlinedIcon color="action" className={styles.fileIcon} />
                            <MuiLink
                                href={Lecture.fileUrl(a.downloadUrl)}
                                target="_blank"
                                rel="noopener"
                                className={styles.fileLink}
                            >
                                {a.fileName}
                            </MuiLink>
                            {props.isTeacher && (
                                <IconButton
                                    size="small"
                                    aria-label="Remove file"
                                    onClick={() => props.onRemoveTeacherMaterial(a.id)}
                                    className={styles.removeBtn}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Stack>
            )}

            {props.isTeacher && (
                <Box className={attachments.length > 0 ? styles.uploadWrapWithItems : styles.uploadWrapNoItems}>
                    <Button
                        variant="contained"
                        component="label"
                        fullWidth
                        startIcon={<CloudUploadOutlinedIcon />}
                        disabled={props.uploadingTeacherMaterial}
                        className={styles.uploadBtn}
                        sx={(t) => ({
                            "--st-upload-hover-shadow": `0 4px 14px ${alpha(t.palette.primary.main, 0.35)}`,
                        })}
                    >
                        {props.uploadingTeacherMaterial ? "Uploading…" : "Upload file"}
                        <input type="file" hidden onChange={props.onUploadTeacherMaterial} />
                    </Button>
                    <Typography variant="caption" display="block" className={styles.hint}>
                        Allowed types match lecture materials (PDF, Office docx, images, zip, etc.).
                    </Typography>
                </Box>
            )}
        </SectionCard>
    );
}

