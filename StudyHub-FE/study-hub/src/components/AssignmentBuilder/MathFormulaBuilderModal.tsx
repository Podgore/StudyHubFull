import * as React from "react";
import { Backdrop, Box, Button, Fade, IconButton, Modal, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { MathLatexPreview, renderLatexHtml } from "./mathLatexPreview";

const ACCENT = "#7c3aed";
const ACCENT2 = "#3b82f6";

const BASIC_OPS: { label: string; insert: string }[] = [
    { label: "+", insert: "+" },
    { label: "−", insert: "-" },
    { label: "×", insert: "\\times " },
    { label: "÷", insert: "\\div " },
    { label: "=", insert: "=" },
    { label: "≠", insert: "\\neq " },
    { label: "<", insert: "<" },
    { label: ">", insert: ">" },
    { label: "≤", insert: "\\leq " },
    { label: "≥", insert: "\\geq " },
    { label: "±", insert: "\\pm " },
    { label: "∓", insert: "\\mp " },
];

type TemplateItem = { name: string; insert: string; previewLatex: string };

const TEMPLATES: TemplateItem[] = [
    { name: "Power / exponent", insert: "x^{2}", previewLatex: "x^2" },
    { name: "Power n", insert: "x^{n}", previewLatex: "x^n" },
    { name: "Square root", insert: "\\sqrt{x}", previewLatex: "\\sqrt{x}" },
    { name: "nth root", insert: "\\sqrt[n]{x}", previewLatex: "\\sqrt[n]{x}" },
    { name: "Fraction", insert: "\\frac{a}{b}", previewLatex: "\\frac{a}{b}" },
    { name: "Integral", insert: "\\int", previewLatex: "\\int" },
    { name: "Summation", insert: "\\sum", previewLatex: "\\sum" },
    { name: "Product", insert: "\\prod", previewLatex: "\\prod" },
];

export interface MathFormulaBuilderModalProps {
    open: boolean;
    initialLatex: string;
    onClose: () => void;
    onInsert: (latex: string) => void;
}

function TemplatePreviewGlyph({ latex }: { latex: string }) {
    const html = renderLatexHtml(latex, false);
    return (
        <Box
            sx={{
                minHeight: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& .katex": { fontSize: "1.05rem" },
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

const MathFormulaBuilderModal = ({ open, initialLatex, onClose, onInsert }: MathFormulaBuilderModalProps) => {
    const [formula, setFormula] = React.useState("");

    React.useEffect(() => {
        if (open) {
            setFormula(initialLatex ?? "");
        }
    }, [open, initialLatex]);

    const append = (s: string) => setFormula((f) => f + s);

    const handleBackspace = () => {
        setFormula((f) => (f.length > 0 ? f.slice(0, -1) : f));
    };

    const handleInsert = () => {
        onInsert(formula.trim());
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
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
                        width: "min(calc(100vw - 24px), 640px)",
                        maxHeight: "calc(100vh - 24px)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "background.paper",
                        borderRadius: "16px",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                        outline: "none",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                            px: 2.5,
                            py: 2,
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "12px",
                                bgcolor: ACCENT,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1 }}>
                                Σ
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
                                Math Formula Builder
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                Build mathematical expressions visually
                            </Typography>
                        </Box>
                        <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            px: 2.5,
                            pb: 2,
                            overflowY: "auto",
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <Box
                            sx={{
                                border: "2px solid",
                                borderColor: "rgba(124, 58, 237, 0.35)",
                                borderRadius: "12px",
                                p: 1.5,
                                bgcolor: "rgba(124, 58, 237, 0.04)",
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#6b7280", letterSpacing: 0.4 }}>
                                Formula preview
                            </Typography>
                            <Box
                                sx={{
                                    mt: 1,
                                    minHeight: 88,
                                    px: 1.5,
                                    py: 1.5,
                                    borderRadius: "10px",
                                    bgcolor: "#fff",
                                    border: "1px solid",
                                    borderColor: "rgba(0,0,0,0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {formula.trim() ? (
                                    <MathLatexPreview latex={formula} displayMode />
                                ) : (
                                    <Typography color="text.secondary" sx={{ textAlign: "center", fontSize: "0.9rem" }}>
                                        Click buttons below to build your formula…
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ display: "flex", gap: 1, mt: 1.25, flexWrap: "wrap" }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="error"
                                    onClick={() => setFormula("")}
                                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleBackspace}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 700,
                                        borderRadius: "8px",
                                        bgcolor: "#4b5563",
                                        "&:hover": { bgcolor: "#374151" },
                                    }}
                                >
                                    Backspace
                                </Button>
                            </Box>
                        </Box>

                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mt: 2.5, mb: 1 }}>
                            Basic operators
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(6, 1fr)" },
                                gap: 0.75,
                            }}
                        >
                            {BASIC_OPS.map((op) => (
                                <Button
                                    key={op.label}
                                    variant="outlined"
                                    onClick={() => append(op.insert)}
                                    sx={{
                                        minWidth: 0,
                                        py: 0.85,
                                        fontWeight: 700,
                                        fontSize: "1rem",
                                        borderColor: "rgba(0,0,0,0.12)",
                                        color: "text.primary",
                                        borderRadius: "10px",
                                    }}
                                >
                                    {op.label}
                                </Button>
                            ))}
                        </Box>

                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mt: 2.5, mb: 1 }}>
                            Templates &amp; functions
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                                gap: 0.85,
                            }}
                        >
                            {TEMPLATES.map((t) => (
                                <Button
                                    key={t.name}
                                    variant="outlined"
                                    onClick={() => append(t.insert)}
                                    sx={{
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        py: 1,
                                        px: 0.75,
                                        minWidth: 0,
                                        borderColor: "rgba(96, 165, 250, 0.55)",
                                        borderRadius: "10px",
                                        textTransform: "none",
                                        gap: 0.5,
                                    }}
                                >
                                    <TemplatePreviewGlyph latex={t.previewLatex} />
                                    <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 600, color: "text.secondary", lineHeight: 1.2 }}
                                    >
                                        {t.name}
                                    </Typography>
                                </Button>
                            ))}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: 1,
                            px: 2.5,
                            py: 2,
                            flexShrink: 0,
                            borderTop: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, color: "text.secondary" }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleInsert}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: "10px",
                                px: 2.5,
                                py: 1,
                                background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                                boxShadow: "none",
                                "&:hover": {
                                    boxShadow: "none",
                                    background: `linear-gradient(90deg, #6d28d9 0%, #2563eb 100%)`,
                                },
                            }}
                        >
                            Insert formula
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
};

export default MathFormulaBuilderModal;
