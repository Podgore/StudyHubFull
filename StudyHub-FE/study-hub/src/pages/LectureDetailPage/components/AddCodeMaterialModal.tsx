import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";

export interface AddCodeMaterialModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: { title: string; language: string | null; content: string }) => void;
}

const AddCodeMaterialModal = ({ open, onClose, onSubmit }: AddCodeMaterialModalProps) => {
    const [title, setTitle] = useState("");
    const [language, setLanguage] = useState("");
    const [content, setContent] = useState("");

    useEffect(() => {
        if (open) {
            setTitle("");
            setLanguage("");
            setContent("");
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Add code block (material)</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
                    <TextField
                        label="Language (optional)"
                        fullWidth
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="e.g. csharp, typescript"
                    />
                    <TextField label="Code" fullWidth multiline minRows={8} value={content} onChange={(e) => setContent(e.target.value)} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={() =>
                        onSubmit({
                            title: title || "Code",
                            language: language.trim() ? language : null,
                            content,
                        })
                    }
                    variant="contained"
                    disabled={!content.trim()}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCodeMaterialModal;
