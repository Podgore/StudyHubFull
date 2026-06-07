import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import { Box, Button, Typography } from "@mui/material";

const PURPLE = "#7c3aed";
const PURPLE_HOVER = "#6d28d9";

export type TestSessionModalVariant = "submit" | "leave";

interface TestSessionModalProps {
    open: boolean;
    variant: TestSessionModalVariant;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmDisabled?: boolean;
}

export function TestSessionModal({
    open,
    variant,
    onClose,
    onConfirm,
    confirmLabel,
    cancelLabel = "Cancel",
    confirmDisabled,
}: TestSessionModalProps) {
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
        if (!open) setBusy(false);
    }, [open]);

    const title = variant === "submit" ? "Submit test?" : "Leave this test?";
    const body =
        variant === "submit"
            ? "Do you really want to submit the test with your current answers? You will not be able to change them afterward."
            : "If you leave now, this test will end and your current answers will be submitted. Are you sure you want to leave?";
    const defaultConfirm = variant === "submit" ? "Submit test" : "Leave and submit";

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={busy ? undefined : onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{ backdrop: { timeout: 400 } }}
        >
            <Fade in={open}>
                <Box
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "min(calc(100vw - 32px), 440px)",
                        bgcolor: "background.paper",
                        borderRadius: "16px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        outline: "none",
                        border: "1px solid",
                        borderColor: "divider",
                        p: 3,
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: "#1f2937" }}>
                        {title}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", mb: 3, lineHeight: 1.55 }}>
                        {body}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            disabled={busy}
                            onClick={onClose}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px" }}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant="contained"
                            disabled={busy || confirmDisabled}
                            onClick={() => void handleConfirm()}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: "10px",
                                bgcolor: PURPLE,
                                boxShadow: "none",
                                "&:hover": { bgcolor: PURPLE_HOVER, boxShadow: "none" },
                            }}
                        >
                            {busy ? "Please wait…" : confirmLabel ?? defaultConfirm}
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
}
