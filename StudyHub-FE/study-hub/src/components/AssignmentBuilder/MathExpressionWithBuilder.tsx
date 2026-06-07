import { useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import MathExpressionField, { MathExpressionFieldProps } from "./MathExpressionField";
import MathFormulaBuilderModal from "./MathFormulaBuilderModal";

export type MathExpressionWithBuilderProps = MathExpressionFieldProps & {
    variant?: "default" | "compact";
};

const MathExpressionWithBuilder = ({
    value,
    onChange,
    minHeight,
    "aria-labelledby": ariaLabelledBy,
    variant = "default",
}: MathExpressionWithBuilderProps) => {
    const [builderOpen, setBuilderOpen] = useState(false);

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <MathExpressionField
                        value={value}
                        onChange={onChange}
                        minHeight={minHeight}
                        aria-labelledby={ariaLabelledBy}
                    />
                </Box>
                {variant === "default" ? (
                    <Button
                        variant="outlined"
                        onClick={() => setBuilderOpen(true)}
                        sx={{
                            flexShrink: 0,
                            mt: "2px",
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: "10px",
                            borderColor: "rgba(124, 58, 237, 0.45)",
                            color: "#7c3aed",
                            px: 1.5,
                            whiteSpace: "nowrap",
                            gap: 0.75,
                            "&:hover": {
                                borderColor: "rgba(124, 58, 237, 0.75)",
                                backgroundColor: "rgba(124, 58, 237, 0.06)",
                            },
                        }}
                    >
                        <Typography component="span" sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>
                            Σ
                        </Typography>
                        Formula
                    </Button>
                ) : (
                    <IconButton
                        size="small"
                        aria-label="Open math formula builder"
                        title="Math formula builder"
                        onClick={() => setBuilderOpen(true)}
                        sx={{
                            flexShrink: 0,
                            mt: "2px",
                            border: "1px solid",
                            borderColor: "rgba(124, 58, 237, 0.4)",
                            borderRadius: "8px",
                            color: "#7c3aed",
                            "&:hover": {
                                backgroundColor: "rgba(124, 58, 237, 0.08)",
                            },
                        }}
                    >
                        <Typography sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1 }}>Σ</Typography>
                    </IconButton>
                )}
            </Box>
            <MathFormulaBuilderModal
                open={builderOpen}
                initialLatex={value}
                onClose={() => setBuilderOpen(false)}
                onInsert={(latex) => onChange(latex)}
            />
        </Box>
    );
};

export default MathExpressionWithBuilder;
