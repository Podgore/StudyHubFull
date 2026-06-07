import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    danger,
}: ConfirmDialogProps) => (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" aria-labelledby="confirm-dialog-title">
        <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
        <DialogContent>
            <DialogContentText component="span" sx={{ whiteSpace: "pre-wrap" }}>
                {message}
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onCancel} color="inherit">
                {cancelLabel}
            </Button>
            <Button onClick={onConfirm} variant="contained" color={danger ? "error" : "primary"} autoFocus>
                {confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
