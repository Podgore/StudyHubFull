import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import type { LectureResponse } from "../../../api/models/response/LectureResponse";
import { formatLectureDate } from "../../../utils/lectureDisplay";

export interface EditLectureModalProps {
    open: boolean;
    lecture: LectureResponse | null;
    onClose: () => void;
    onSave: (payload: { title: string; lectureDate: string }) => void;
}

const EditLectureModal = ({ open, lecture, onClose, onSave }: EditLectureModalProps) => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        if (open && lecture) {
            setTitle(lecture.title);
            setDate(formatLectureDate(lecture.lectureDate));
        }
    }, [open, lecture]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit lecture</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={() => onSave({ title, lectureDate: new Date(date).toISOString() })}
                    variant="contained"
                    disabled={!title.trim()}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditLectureModal;
