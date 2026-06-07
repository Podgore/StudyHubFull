import { Box, Button, Stack, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LinkIcon from "@mui/icons-material/Link";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import CodeIcon from "@mui/icons-material/Code";
import type { MutableRefObject } from "react";
import type { LectureMaterialResponse } from "../../../api/models/response/LectureMaterialResponse";
import LectureMaterialCard from "./LectureMaterialCard";
import styles from "../LectureDetailPage.module.css";

const primaryOutlinedSx = {
    textTransform: "none" as const,
    fontWeight: 600,
    borderColor: "#d41a6d",
    color: "#d41a6d",
    borderRadius: "8px",
    "&:hover": {
        borderColor: "#b0155c",
        color: "#b0155c",
        backgroundColor: "rgba(212, 26, 109, 0.06)",
    },
};

export interface LectureMaterialsSectionProps {
    materials: LectureMaterialResponse[];
    isTeacher: boolean;
    fileInputRef: MutableRefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    videoFileInputRef: MutableRefObject<HTMLInputElement | null>;
    onVideoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenAddLink: () => void;
    onOpenAddVideoUrl: () => void;
    onOpenAddCode: () => void;
    onRemoveMaterial: (m: LectureMaterialResponse) => void;
    onInsertDescriptionLink?: (m: LectureMaterialResponse) => void;
}

const LectureMaterialsSection = ({
    materials,
    isTeacher,
    fileInputRef,
    onFileChange,
    videoFileInputRef,
    onVideoFileChange,
    onOpenAddLink,
    onOpenAddVideoUrl,
    onOpenAddCode,
    onRemoveMaterial,
    onInsertDescriptionLink,
}: LectureMaterialsSectionProps) => {
    const n = materials.length;

    return (
        <section className={styles.materialsPanel}>
            <div className={styles.materialsHeader}>
                <div className={styles.materialsTitleRow}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 22, color: "#6b7280" }} />
                    <Typography component="h2" className={styles.materialsTitle}>
                        Materials
                    </Typography>
                </div>
                {isTeacher && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <input type="file" hidden ref={fileInputRef} onChange={onFileChange} />
                        <input
                            type="file"
                            hidden
                            ref={videoFileInputRef}
                            accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
                            onChange={onVideoFileChange}
                        />
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AttachFileIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            sx={primaryOutlinedSx}
                        >
                            Add file
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VideocamOutlinedIcon />}
                            onClick={() => videoFileInputRef.current?.click()}
                            sx={primaryOutlinedSx}
                        >
                            Upload video
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VideocamOutlinedIcon />}
                            onClick={onOpenAddVideoUrl}
                            sx={primaryOutlinedSx}
                        >
                            Video URL
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={onOpenAddLink} sx={primaryOutlinedSx}>
                            Add link
                        </Button>
                        <Button size="small" variant="outlined" startIcon={<CodeIcon />} onClick={onOpenAddCode} sx={primaryOutlinedSx}>
                            Add code block
                        </Button>
                    </Stack>
                )}
            </div>

            <Box className={styles.materialList}>
                {materials.map((m) => (
                    <LectureMaterialCard
                        key={m.id}
                        material={m}
                        isTeacher={isTeacher}
                        onRemove={() => onRemoveMaterial(m)}
                        onInsertDescriptionLink={onInsertDescriptionLink}
                    />
                ))}
                {n === 0 && (
                    <Typography className={styles.emptyMaterialsHint}>
                        No materials yet. Add files, videos, links, or code blocks for this lecture.
                    </Typography>
                )}
            </Box>
        </section>
    );
};

export default LectureMaterialsSection;
