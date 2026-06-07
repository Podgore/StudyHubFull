import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";

export interface AddLinkMaterialModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: { title: string; url: string }) => void;
    variant?: "link" | "video";
}

const AddLinkMaterialModal = ({ open, onClose, onSubmit, variant = "link" }: AddLinkMaterialModalProps) => {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (open) {
            setTitle("");
            setUrl("");
        }
    }, [open]);

    const isVideo = variant === "video";
    const defaultTitle = isVideo ? "Video" : "Link";

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isVideo ? "Add video (URL)" : "Add link"}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
                    <TextField
                        label={isVideo ? "Video URL" : "URL"}
                        fullWidth
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={isVideo ? "https://…" : undefined}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={() => onSubmit({ title: title.trim() || defaultTitle, url })}
                    variant="contained"
                    disabled={!url.trim()}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddLinkMaterialModal;
