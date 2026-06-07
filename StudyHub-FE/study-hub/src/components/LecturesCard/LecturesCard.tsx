import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LecturesCard.module.css";
import type { LectureResponse } from "../../api/models/response/LectureResponse";
import type UserResponse from "../../api/models/response/UserResponse";
import Lecture from "../../api/Lecture";
import useNotification from "../../hooks/useNotification";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { formatLectureDate } from "../../utils/lectureDisplay";

const greenBtnSx = {
    bgcolor: "#4caf50",
    color: "#fff",
    textTransform: "none",
    borderRadius: 2,
    fontWeight: 600,
    "&:hover": { bgcolor: "#43a047" },
};

interface LecturesCardProps {
    lectures: LectureResponse[] | undefined;
    user: UserResponse | undefined;
    subjectId: string | undefined;
    onLecturesUpdated?: () => void;
}

const LecturesCard = ({ lectures, user, subjectId, onLecturesUpdated }: LecturesCardProps) => {
    const lectureList = Array.isArray(lectures) ? lectures : [];
    const isTeacher = user?.role.toLowerCase() === "teacher";
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();
    const [createOpen, setCreateOpen] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formDate, setFormDate] = useState("");

    const [confirm, setConfirm] = useState<{
        title: string;
        message: string;
        danger?: boolean;
        onConfirm: () => void;
    } | null>(null);

    const refresh = useCallback(() => {
        onLecturesUpdated?.();
    }, [onLecturesUpdated]);

    const openCreate = () => {
        setFormTitle("");
        setFormDescription("");
        setFormDate(new Date().toISOString().slice(0, 10));
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        if (!subjectId) return;
        const res = await Lecture.create(subjectId, {
            title: formTitle,
            description: formDescription,
            lectureDate: new Date(formDate).toISOString(),
            materials: [],
        });
        if (res) {
            notifySuccess("Lecture created");
            setCreateOpen(false);
            refresh();
        } else notifyError("Could not create lecture");
    };

    const askDeleteLecture = (lec: LectureResponse) => {
        setConfirm({
            title: "Delete lecture",
            message: `Delete "${lec.title}"? This cannot be undone.`,
            danger: true,
            onConfirm: async () => {
                setConfirm(null);
                const ok = await Lecture.delete(lec.id);
                if (ok) {
                    notifySuccess("Lecture deleted");
                    refresh();
                } else notifyError("Could not delete lecture");
            },
        });
    };

    const goToLecture = (lec: LectureResponse) => {
        if (!subjectId) return;
        navigate(`/subject/${subjectId}/lecture/${lec.id}`);
    };

    return (
        <div className={styles.lecturesBox}>
            <Box className={styles.sectionHeader}>
                <SchoolOutlinedIcon sx={{ fontSize: 40, color: "text.secondary", mt: 0.5 }} />
                <Box className={styles.headerText}>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                        Lectures &amp; Lessons
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Overview of lectures — open one for materials, description, and code
                    </Typography>
                </Box>
                {isTeacher && (
                    <Button variant="contained" startIcon={<AddIcon />} sx={greenBtnSx} onClick={openCreate}>
                        Add Lecture
                    </Button>
                )}
            </Box>

            {lectureList.map((lec) => {
                const n = lec.materials?.length ?? 0;
                return (
                    <Paper
                        key={lec.id}
                        variant="outlined"
                        role="button"
                        tabIndex={0}
                        aria-label={`Open lecture: ${lec.title}`}
                        onClick={() => goToLecture(lec)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                goToLecture(lec);
                            }
                        }}
                        sx={{
                            p: 2,
                            mb: 2,
                            cursor: "pointer",
                            borderRadius: 2,
                            borderColor: "divider",
                            boxShadow: "0px 1px 1px rgba(0,0,0,0.1)",
                            transition: "box-shadow 0.2s ease-in-out",
                            "&:hover": { boxShadow: "0px 4px 8px rgba(76, 175, 80, 0.2)" },
                            "&:focus-visible": { boxShadow: "0px 4px 8px rgba(76, 175, 80, 0.2)" },
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Box flex="1 1 200px" minWidth={0}>
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                    {lec.title}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                    <Chip
                                        label={`${n} material${n === 1 ? "" : "s"}`}
                                        size="small"
                                        sx={{
                                            bgcolor: "rgba(76, 175, 80, 0.12)",
                                            color: "#2e7d32",
                                            fontWeight: 600,
                                            border: "none",
                                        }}
                                    />
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <CalendarTodayOutlinedIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            {formatLectureDate(lec.lectureDate)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            {isTeacher && (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            askDeleteLecture(lec);
                                        }}
                                        aria-label="Delete lecture"
                                        color="error"
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                );
            })}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>New lecture</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Title" fullWidth value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
                        <TextField
                            label="Short summary (optional)"
                            fullWidth
                            multiline
                            minRows={2}
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            helperText="Full description, code, and files are edited on the lecture details page."
                        />
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={submitCreate} variant="contained" disabled={!formTitle.trim()}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

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

export default LecturesCard;
