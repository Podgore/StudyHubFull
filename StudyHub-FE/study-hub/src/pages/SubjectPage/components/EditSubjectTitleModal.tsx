import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useState } from "react";

export interface EditSubjectTitleModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    onSave: (title: string) => void;
    saving?: boolean;
}

const EditSubjectTitleModal = ({
    open,
    title,
    onClose,
    onSave,
    saving = false,
}: EditSubjectTitleModalProps) => {
    const [draft, setDraft] = useState(title);

    useEffect(() => {
        if (open) {
            setDraft(title);
        }
    }, [open, title]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit subject title</DialogTitle>
            <DialogContent>
                <TextField
                    label="Title"
                    fullWidth
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = draft.trim();
                            if (trimmed) onSave(trimmed);
                        }
                    }}
                    sx={{ mt: 1 }}
                    autoFocus
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(draft.trim())}
                    variant="contained"
                    disabled={!draft.trim() || saving}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditSubjectTitleModal;
