import { Box, MenuItem, Select, Typography } from "@mui/material";

export const questionTypeLabel = (mode: "Single" | "Multi" | "RichText" | null): string => {
    if (mode === "Single") return "Single choice";
    if (mode === "Multi") return "Multiple choice";
    if (mode === "RichText") return "Rich text";
    return "";
};

interface ModeSelectorProps {
    activeMode: string | null;
    handleSetActiveMode: (type: "Single" | "Multi" | "RichText") => void;
}

const ModeSelector = ({ activeMode, handleSetActiveMode }: ModeSelectorProps) => {
    const selectId = "assignment-question-type-select";

    return (
        <Box sx={{ width: "100%" }}>
            <Typography
                component="label"
                htmlFor={selectId}
                variant="subtitle2"
                sx={{
                    display: "block",
                    mb: 0.75,
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "#5b21b6",
                }}
            >
                Question type
            </Typography>
            <Select
                id={selectId}
                fullWidth
                size="small"
                displayEmpty
                value={activeMode ?? ""}
                onChange={(event) =>
                    handleSetActiveMode(event.target.value as "Single" | "Multi" | "RichText")
                }
                renderValue={(value) =>
                    value === "" ? (
                        <Typography component="span" sx={{ color: "text.secondary" }}>
                            Choose type
                        </Typography>
                    ) : (
                        questionTypeLabel(value as "Single" | "Multi" | "RichText")
                    )
                }
                inputProps={{ "aria-label": "Question type" }}
                sx={{
                    borderRadius: "10px",
                    backgroundColor: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(124, 58, 237, 0.35)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(124, 58, 237, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#7c3aed",
                    },
                }}
            >
                <MenuItem value="" disabled>
                    <em>Choose type</em>
                </MenuItem>
                <MenuItem value="Single">Single choice</MenuItem>
                <MenuItem value="Multi">Multiple choice</MenuItem>
                <MenuItem value="RichText">Rich text</MenuItem>
            </Select>
        </Box>
    );
};

export default ModeSelector;
