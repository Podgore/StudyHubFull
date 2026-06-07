import { Box, Breadcrumbs, Button, Chip, IconButton, Link as MuiLink, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import PageHeader from "../../components/PageHeader/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import User from "../../api/User";
import Subject from "../../api/Subject";
import Lecture from "../../api/Lecture";
import type UserResponse from "../../api/models/response/UserResponse";
import type SubjectResponse from "../../api/models/response/SubjectResponse";
import type { LectureResponse } from "../../api/models/response/LectureResponse";
import { MaterialType, type LectureMaterialResponse } from "../../api/models/response/LectureMaterialResponse";
import useNotification from "../../hooks/useNotification";
import { formatLectureDate } from "../../utils/lectureDisplay";
import EditLectureModal from "./components/EditLectureModal";
import AddLinkMaterialModal from "./components/AddLinkMaterialModal";
import AddCodeMaterialModal from "./components/AddCodeMaterialModal";
import LectureMaterialsSection from "./components/LectureMaterialsSection";
import { markdownMaterialLink, renderLectureDescriptionWithMaterialLinks } from "./utils/renderLectureDescription";
import styles from "./LectureDetailPage.module.css";
import shell from "../../layouts/AuthenticatedShell.module.css";

const LectureDetailPage = () => {
    const { subjectId, lectureId } = useParams<{ subjectId: string; lectureId: string }>();
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();

    const [user, setUser] = useState<UserResponse | undefined>();
    const [subject, setSubject] = useState<SubjectResponse | undefined>();
    const [lecture, setLecture] = useState<LectureResponse | undefined>();
    const [loadError, setLoadError] = useState(false);

    const isTeacher = user?.role.toLowerCase() === "teacher";

    const [editOpen, setEditOpen] = useState(false);
    const [linkOpen, setLinkOpen] = useState(false);
    const [videoUrlOpen, setVideoUrlOpen] = useState(false);
    const [codeMaterialOpen, setCodeMaterialOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const videoFileInputRef = useRef<HTMLInputElement | null>(null);

    const [confirm, setConfirm] = useState<{
        title: string;
        message: string;
        danger?: boolean;
        onConfirm: () => void;
    } | null>(null);

    const [descriptionDraft, setDescriptionDraft] = useState("");
    const [descriptionEditMode, setDescriptionEditMode] = useState(false);
    const [descriptionSaving, setDescriptionSaving] = useState(false);

    const refreshLecture = useCallback(async () => {
        if (!lectureId) return;
        const data = await Lecture.getById(lectureId);
        if (data) {
            setLecture(data);
            setLoadError(false);
        } else {
            setLecture(undefined);
            setLoadError(true);
        }
    }, [lectureId]);

    useEffect(() => {
        User.me()
            .then(setUser)
            .catch(() => setUser(undefined));
    }, []);

    useEffect(() => {
        if (!subjectId) return;
        Subject.getSubject(subjectId)
            .then(setSubject)
            .catch(() => setSubject(undefined));
    }, [subjectId]);

    useEffect(() => {
        refreshLecture();
    }, [refreshLecture]);

    useEffect(() => {
        if (lecture) setDescriptionDraft(lecture.description ?? "");
    }, [lecture?.id, lecture?.description]);

    const applyDescriptionEdit = async () => {
        if (!lecture || !isTeacher) return;
        const next = descriptionDraft;
        const prev = lecture.description ?? "";
        if (next === prev) {
            setDescriptionEditMode(false);
            return;
        }
        setDescriptionSaving(true);
        const res = await Lecture.update(lecture.id, {
            title: lecture.title,
            description: next,
            lectureDate: lecture.lectureDate,
        });
        setDescriptionSaving(false);
        if (res) {
            setLecture(res);
            setDescriptionDraft(res.description ?? "");
            setDescriptionEditMode(false);
            notifySuccess("Description saved");
        } else {
            notifyError("Could not save description");
            setDescriptionDraft(prev);
        }
    };

    const cancelDescriptionEdit = () => {
        if (!lecture) return;
        setDescriptionDraft(lecture.description ?? "");
        setDescriptionEditMode(false);
    };

    const insertMaterialLinkInDescription = (m: LectureMaterialResponse) => {
        setDescriptionEditMode(true);
        const snippet = markdownMaterialLink(m.id, m.title);
        setDescriptionDraft((prev) => {
            const base = (prev ?? lecture?.description ?? "").trimEnd();
            const sep = base.length > 0 && !base.endsWith("\n") ? "\n" : "";
            return `${base}${sep}${snippet}\n`;
        });
    };

    const materialHighlightTimersRef = useRef<Map<Element, number>>(new Map());

    const flashMaterialTarget = useCallback((materialId: string) => {
        queueMicrotask(() => {
            const el = document.getElementById(`lecture-material-${materialId}`);
            if (!el) return;
            const prevTimer = materialHighlightTimersRef.current.get(el);
            if (prevTimer !== undefined) window.clearTimeout(prevTimer);
            el.classList.remove(styles.materialTargetHighlight);
            requestAnimationFrame(() => {
                el.classList.add(styles.materialTargetHighlight);
                const t = window.setTimeout(() => {
                    el.classList.remove(styles.materialTargetHighlight);
                    materialHighlightTimersRef.current.delete(el);
                }, 1500);
                materialHighlightTimersRef.current.set(el, t);
            });
        });
    }, []);

    useEffect(() => {
        const syncHighlightFromHash = () => {
            const hash = window.location.hash;
            if (!hash.startsWith("#lecture-material-")) return;
            const id = hash.slice("#lecture-material-".length);
            if (!/^[0-9a-fA-F-]{36}$/.test(id)) return;
            flashMaterialTarget(id);
        };

        syncHighlightFromHash();
        window.addEventListener("hashchange", syncHighlightFromHash);
        return () => {
            window.removeEventListener("hashchange", syncHighlightFromHash);
            materialHighlightTimersRef.current.forEach((t) => window.clearTimeout(t));
            materialHighlightTimersRef.current.clear();
        };
    }, [lecture?.id, lecture?.materials?.length, flashMaterialTarget]);

    const saveLecture = async (payload: { title: string; lectureDate: string }) => {
        if (!lecture) return;
        const res = await Lecture.update(lecture.id, {
            title: payload.title,
            description: lecture.description ?? "",
            lectureDate: payload.lectureDate,
        });
        if (res) {
            notifySuccess("Lecture saved");
            setEditOpen(false);
            setLecture(res);
        } else notifyError("Could not save lecture");
    };

    const askDeleteLecture = () => {
        if (!lecture || !subjectId) return;
        setConfirm({
            title: "Delete lecture",
            message: `Delete "${lecture.title}"? This cannot be undone.`,
            danger: true,
            onConfirm: async () => {
                setConfirm(null);
                const ok = await Lecture.delete(lecture.id);
                if (ok) {
                    notifySuccess("Lecture deleted");
                    navigate(`/subject/${subjectId}`);
                } else notifyError("Could not delete lecture");
            },
        });
    };

    const askRemoveMaterial = (m: LectureMaterialResponse) => {
        setConfirm({
            title: "Remove material",
            message: `Remove "${m.title}"?`,
            danger: true,
            onConfirm: async () => {
                setConfirm(null);
                const ok = await Lecture.deleteMaterial(m.id);
                if (ok) {
                    notifySuccess("Material removed");
                    refreshLecture();
                } else notifyError("Could not remove material");
            },
        });
    };

    const submitLink = async ({ title, url }: { title: string; url: string }) => {
        if (!lecture) return;
        const orderIndex = lecture.materials?.length ?? 0;
        const res = await Lecture.addMaterial(lecture.id, {
            type: MaterialType.Link,
            title,
            orderIndex,
            isVisible: true,
            externalUrl: url,
        });
        if (res) {
            notifySuccess("Link added");
            setLinkOpen(false);
            refreshLecture();
        } else notifyError("Could not add link");
    };

    const submitVideoUrl = async ({ title, url }: { title: string; url: string }) => {
        if (!lecture) return;
        const orderIndex = lecture.materials?.length ?? 0;
        const res = await Lecture.addMaterial(lecture.id, {
            type: MaterialType.Video,
            title,
            orderIndex,
            isVisible: true,
            externalUrl: url,
        });
        if (res) {
            notifySuccess("Video link added");
            setVideoUrlOpen(false);
            refreshLecture();
        } else notifyError("Could not add video");
    };

    const submitCodeMaterial = async (payload: { title: string; language: string | null; content: string }) => {
        if (!lecture) return;
        const orderIndex = lecture.materials?.length ?? 0;
        const res = await Lecture.addMaterial(lecture.id, {
            type: MaterialType.Code,
            title: payload.title,
            orderIndex,
            isVisible: true,
            content: payload.content,
            language: payload.language,
        });
        if (res) {
            notifySuccess("Code snippet added");
            setCodeMaterialOpen(false);
            refreshLecture();
        } else notifyError("Could not add code snippet");
    };

    const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !lecture) return;
        const orderIndex = lecture.materials?.length ?? 0;
        const res = await Lecture.addFileMaterial(lecture.id, {
            file,
            title: file.name,
            orderIndex,
            isVisible: true,
        });
        if (res) {
            notifySuccess("File uploaded");
            refreshLecture();
        } else notifyError("Could not upload file");
    };

    const onVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !lecture) return;
        const orderIndex = lecture.materials?.length ?? 0;
        const res = await Lecture.addUploadedVideoMaterial(lecture.id, {
            file,
            title: file.name.replace(/\.[^/.]+$/, "") || file.name,
            orderIndex,
            isVisible: true,
        });
        if (res) {
            notifySuccess("Video uploaded");
            refreshLecture();
        } else notifyError("Could not upload video");
    };

    const n = lecture?.materials?.length ?? 0;
    const materials = lecture?.materials ?? [];

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="subjects" user={user} />
                <div className={`${styles.mainSurface} ${shell.mainScroll}`}>
                    <div className={styles.content}>
                    <Button
                        startIcon={<ArrowBackIcon sx={{ fontSize: 20 }} />}
                        component={RouterLink}
                        to={subjectId ? `/subject/${subjectId}` : "/subjects"}
                        className={styles.backLink}
                        sx={{ color: "#d41a6d", "&:hover": { color: "#b0155c" } }}
                    >
                        Back to subject
                    </Button>

                    {loadError && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            Could not load this lecture, or you do not have access.
                        </Typography>
                    )}

                    {lecture && (
                        <>
                            <Breadcrumbs
                                className={styles.breadcrumbs}
                                separator={<span className={styles.breadcrumbMuted}> / </span>}
                            >
                                <MuiLink component={RouterLink} to="/subjects" className={styles.breadcrumbLink} underline="none">
                                    Subjects
                                </MuiLink>
                                <MuiLink
                                    component={RouterLink}
                                    to={`/subject/${subjectId}`}
                                    className={styles.breadcrumbLink}
                                    underline="none"
                                >
                                    {subject?.title ?? "Subject"}
                                </MuiLink>
                                <Typography color="text.primary" sx={{ fontWeight: 500, color: "#374151" }}>
                                    {lecture.title}
                                </Typography>
                            </Breadcrumbs>

                            <Box className={styles.heroBlock}>
                                <Box className={styles.titleRow}>
                                    <Box minWidth={0}>
                                        <Typography
                                            variant="h5"
                                            component="h1"
                                            className={styles.lectureTitle}
                                            sx={{
                                                /* Override MuiTypography-root { margin: 0 } */
                                                margin: "0.35rem 0 0.65rem -0.35rem",
                                            }}
                                        >
                                            {lecture.title}
                                        </Typography>
                                        <Box className={styles.metaRow}>
                                            <span className={styles.metaDate}>
                                                <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                                                {formatLectureDate(lecture.lectureDate)}
                                            </span>
                                            <Chip
                                                label={`${n} material${n === 1 ? "" : "s"}`}
                                                size="small"
                                                className={styles.materialCountChip}
                                            />
                                        </Box>
                                    </Box>
                                    {isTeacher && (
                                        <Box display="flex" gap={0.25}>
                                            <IconButton
                                                onClick={() => setEditOpen(true)}
                                                aria-label="Edit lecture"
                                                className={styles.actionIconBtn}
                                                size="medium"
                                            >
                                                <EditOutlinedIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={askDeleteLecture}
                                                aria-label="Delete lecture"
                                                className={styles.actionIconBtn}
                                                size="medium"
                                            >
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            <section className={styles.descriptionCard}>
                                <Box className={styles.descriptionHeadingRow}>
                                    <Typography component="h2" className={styles.descriptionHeading}>
                                        Description
                                    </Typography>
                                    {isTeacher && !descriptionEditMode && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditOutlinedIcon sx={{ fontSize: 18 }} />}
                                            onClick={() => setDescriptionEditMode(true)}
                                            className={styles.descriptionEditBtn}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </Box>
                                {isTeacher && descriptionEditMode ? (
                                    <>
                                        <TextField
                                            className={styles.descriptionEditor}
                                            value={descriptionDraft}
                                            onChange={(e) => setDescriptionDraft(e.target.value)}
                                            placeholder="Describe this lecture for students… Use the link icon on a material below to insert a jump link."
                                            multiline
                                            minRows={4}
                                            maxRows={18}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            InputProps={{
                                                sx: {
                                                    backgroundColor: "#fafafa",
                                                    borderRadius: "8px",
                                                },
                                            }}
                                        />
                                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
                                            <Button variant="outlined" onClick={cancelDescriptionEdit} disabled={descriptionSaving}>
                                                Cancel
                                            </Button>
                                            <Button variant="contained" onClick={() => void applyDescriptionEdit()} disabled={descriptionSaving}>
                                                Apply
                                            </Button>
                                        </Stack>
                                    </>
                                ) : lecture.description?.trim() ? (
                                    <Typography variant="body1" component="div" sx={{ lineHeight: 1.6 }}>
                                        {renderLectureDescriptionWithMaterialLinks(lecture.description, materials, {
                                            onNavigateToMaterial: flashMaterialTarget,
                                        })}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" sx={{ color: "#9ca3af", fontStyle: "italic" }}>
                                        {isTeacher ? "No description yet. Click Edit to add one." : "No description yet."}
                                    </Typography>
                                )}
                            </section>

                            <LectureMaterialsSection
                                materials={materials}
                                isTeacher={isTeacher}
                                fileInputRef={fileInputRef}
                                onFileChange={onFileSelected}
                                videoFileInputRef={videoFileInputRef}
                                onVideoFileChange={onVideoFileSelected}
                                onOpenAddLink={() => setLinkOpen(true)}
                                onOpenAddVideoUrl={() => setVideoUrlOpen(true)}
                                onOpenAddCode={() => setCodeMaterialOpen(true)}
                                onRemoveMaterial={askRemoveMaterial}
                                onInsertDescriptionLink={isTeacher ? insertMaterialLinkInDescription : undefined}
                            />
                        </>
                    )}
                    </div>
                </div>
            </div>

            <EditLectureModal open={editOpen} lecture={lecture ?? null} onClose={() => setEditOpen(false)} onSave={saveLecture} />

            <AddLinkMaterialModal open={linkOpen} onClose={() => setLinkOpen(false)} onSubmit={submitLink} />

            <AddLinkMaterialModal
                open={videoUrlOpen}
                onClose={() => setVideoUrlOpen(false)}
                onSubmit={submitVideoUrl}
                variant="video"
            />

            <AddCodeMaterialModal open={codeMaterialOpen} onClose={() => setCodeMaterialOpen(false)} onSubmit={submitCodeMaterial} />

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.title ?? ""}
                message={confirm?.message ?? ""}
                confirmLabel={confirm?.danger ? "Delete" : "OK"}
                danger={confirm?.danger}
                onCancel={() => setConfirm(null)}
                onConfirm={() => {
                    const action = confirm?.onConfirm;
                    if (action) action();
                }}
            />
        </div>
    );
};

export default LectureDetailPage;
