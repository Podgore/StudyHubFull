import { Box, Typography } from "@mui/material";
import katex from "katex";
import "katex/dist/katex.min.css";

export function renderLatexHtml(latex: string, displayMode: boolean): string {
    return katex.renderToString(latex || "\\,", {
        throwOnError: false,
        displayMode,
        strict: "ignore",
    });
}

interface MathLatexPreviewProps {
    latex: string;
    displayMode?: boolean;
    emptyLabel?: string;
    fontSize?: string;
}

export function MathLatexPreview({
    latex,
    displayMode = false,
    emptyLabel = "—",
    fontSize,
}: MathLatexPreviewProps) {
    const trimmed = latex?.trim() ?? "";
    if (!trimmed) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {emptyLabel}
            </Typography>
        );
    }
    const html = renderLatexHtml(trimmed, displayMode);
    return (
        <Box
            sx={{
                overflowX: "auto",
                py: 0.25,
                "& .katex": {
                    fontSize: fontSize ?? (displayMode ? "1.2rem" : "1rem"),
                },
            }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
