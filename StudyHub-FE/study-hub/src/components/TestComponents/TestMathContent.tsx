import { Box, Typography } from "@mui/material";
import { MathLatexPreview } from "../AssignmentBuilder/mathLatexPreview";

const LOOKS_LATEX = /\\|\^|_|\{|\}|~|\\frac|\\sqrt|\\sum|\\int|\\prod|\\times|\\div|\\pm|\\leq|\\geq|\\neq/;

export type TestMathVariant = "question" | "option";

export function TestMathContent({ text, variant = "option" }: { text: string; variant?: TestMathVariant }) {
    const t = text ?? "";
    const useKatex = LOOKS_LATEX.test(t);

    if (!useKatex) {
        return (
            <Typography
                component="div"
                sx={{
                    fontSize: variant === "question" ? { xs: "1.2rem", md: "1.45rem" } : { xs: "1rem", sm: "1.1rem" },
                    fontWeight: variant === "question" ? 600 : 500,
                    color: "#1a1a1a",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                    textAlign: variant === "question" ? "left" : "center",
                    width: "100%",
                }}
            >
                {t}
            </Typography>
        );
    }

    return (
        <Box
            sx={{
                width: "100%",
                textAlign: variant === "question" ? "left" : "center",
                overflowX: "auto",
                "& .katex": {
                    fontSize: variant === "question" ? "1.25rem" : "1.05rem",
                },
                "& .katex-display": { margin: "0.5rem 0" },
            }}
        >
            <MathLatexPreview
                latex={t}
                displayMode={variant === "question"}
                emptyLabel=""
                fontSize={variant === "question" ? "1.25rem" : "1.05rem"}
            />
        </Box>
    );
}
