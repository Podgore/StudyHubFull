import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import AddLinkIcon from "@mui/icons-material/AddLink";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Lecture from "../../../api/Lecture";
import { MaterialType, type LectureMaterialResponse } from "../../../api/models/response/LectureMaterialResponse";
import { materialTypeLabel } from "../../../utils/lectureDisplay";
import HighlightedCodeBlock from "./HighlightedCodeBlock";
import styles from "../LectureDetailPage.module.css";

export interface LectureMaterialCardProps {
    material: LectureMaterialResponse;
    isTeacher: boolean;
    onRemove: () => void;
    onInsertDescriptionLink?: (material: LectureMaterialResponse) => void;
}

function linkDisplayText(m: LectureMaterialResponse): string {
    if (m.externalUrl) return m.externalUrl;
    return "Open resource";
}

const LectureMaterialCard = ({ material: m, isTeacher, onRemove, onInsertDescriptionLink }: LectureMaterialCardProps) => (
    <div id={`lecture-material-${m.id}`} className={styles.materialItem}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Box minWidth={0}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.95rem" }}>
                    {m.title}
                </Typography>
                <Chip label={materialTypeLabel(m.type)} size="small" variant="outlined" className={styles.typeChip} sx={{ mt: 0.75 }} />
                {m.type === MaterialType.File && m.fileDownloadUrl && (
                    <Typography variant="body2" sx={{ mt: 1.25 }}>
                        <a
                            href={Lecture.fileUrl(m.fileDownloadUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkAnchor}
                        >
                            {m.fileName ?? "Download file"}
                        </a>
                    </Typography>
                )}
                {m.type === MaterialType.Video && m.videoPlaybackUrl && (
                    <Box sx={{ mt: 1.25 }} className={styles.materialVideoWrap}>
                        <video
                            controls
                            playsInline
                            preload="metadata"
                            className={styles.materialVideo}
                            src={Lecture.fileUrl(m.videoPlaybackUrl)}
                        />
                        {m.videoStoredFileName && (
                            <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "#6b7280" }}>
                                {m.videoStoredFileName}
                            </Typography>
                        )}
                    </Box>
                )}
                {(m.type === MaterialType.Link || (m.type === MaterialType.Video && !m.videoPlaybackUrl)) && m.externalUrl && (
                    <Typography variant="body2" sx={{ mt: 1.25 }}>
                        <a href={m.externalUrl} target="_blank" rel="noopener noreferrer" className={styles.linkAnchor}>
                            {linkDisplayText(m)}
                        </a>
                    </Typography>
                )}
                {m.type === MaterialType.Text && m.textContent && (
                    <Box component="pre" className={styles.codeBlock} sx={{ mt: 1.25 }}>
                        {m.textContent}
                    </Box>
                )}
                {m.type === MaterialType.Code && m.textContent && (
                    <Box sx={{ mt: 1.25 }}>
                        <HighlightedCodeBlock code={m.textContent} language={m.language} />
                    </Box>
                )}
            </Box>
            {isTeacher && (
                <Box display="flex" alignItems="flex-start" gap={0.25}>
                    {onInsertDescriptionLink && (
                        <Tooltip title="Insert link in description">
                            <IconButton
                                size="small"
                                onClick={() => onInsertDescriptionLink(m)}
                                aria-label="Insert link in description"
                                className={styles.actionIconBtn}
                            >
                                <AddLinkIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton size="small" onClick={onRemove} aria-label="Remove material" className={styles.actionIconBtn}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}
        </Box>
    </div>
);

export default LectureMaterialCard;
