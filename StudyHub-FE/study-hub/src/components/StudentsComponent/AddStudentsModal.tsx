import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Modal,
    TextField,
    IconButton,
    Chip,
    Stack,
    Divider,
    Alert,
    CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import Subject from "../../api/Subject";
import { useParams } from "react-router-dom";
import AddStudentsRequest from "../../api/models/request/User/AddStudentsRequest";
import AddStudentsToSubjectResult from "../../api/models/response/AddStudentsToSubjectResult";

interface AddStudentsModalProps {
    isModalOpen: boolean;
    onClose: () => void;
    onEnrollmentChanged?: () => void;
    subjectId?: string;
}

const AddStudentsModal: React.FC<AddStudentsModalProps> = ({
    isModalOpen,
    onClose,
    onEnrollmentChanged,
    subjectId: subjectIdProp,
}) => {
    const { id: idFromRoute } = useParams();
    const id = subjectIdProp ?? idFromRoute;
    const [newStudent, setNewStudent] = useState("");
    const [students, setStudents] = useState<AddStudentsRequest>({ emails: [] });
    const [emailError, setEmailError] = useState<string | null>(null);
    const [submitFeedback, setSubmitFeedback] = useState<AddStudentsToSubjectResult | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isModalOpen) {
            setNewStudent("");
            setStudents({ emails: [] });
            setEmailError(null);
            setSubmitFeedback(null);
            setSubmitError(null);
            setSubmitting(false);
        }
    }, [isModalOpen]);

    const validateEmail = (email: string): boolean => {
        if (email.length < 5 || email.length > 254) return false;
        // Practical single-line address check (local@domain.tld)
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    /** Split pasted "a@b.com, c@d.com" or "a@b.com;" into trimmed lowercase tokens. */
    const parseEmailTokens = (raw: string): string[] => {
        const parts = raw
            .split(/[\s,;]+/u)
            .map((p) => p.trim().toLowerCase())
            .filter((p) => p.length > 0);
        return [...new Set(parts)];
    };

    const tokensInField = parseEmailTokens(newStudent);
    const hasInput = newStudent.trim().length > 0;

    const handleAddStudent = () => {
        const tokens = parseEmailTokens(newStudent);
        if (tokens.length === 0) {
            setEmailError("Enter at least one email address.");
            return;
        }

        const invalid: string[] = [];
        const toAdd: string[] = [];
        for (const t of tokens) {
            if (!validateEmail(t)) {
                invalid.push(t);
                continue;
            }
            if (students.emails.includes(t) || toAdd.includes(t)) continue;
            toAdd.push(t);
        }

        if (invalid.length > 0) {
            setEmailError(
                invalid.length === 1
                    ? `"${invalid[0]}" is not a valid email address.`
                    : `Invalid email${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`,
            );
            return;
        }

        if (toAdd.length === 0) {
            setEmailError(
                tokens.length === 1
                    ? "This student is already added."
                    : "All of these students are already added.",
            );
            return;
        }

        setStudents((prev) => ({
            ...prev,
            emails: [...prev.emails, ...toAdd],
        }));
        setNewStudent("");
        setEmailError(null);
    };

    const handleRemoveStudent = (email: string) => {
        setStudents((prev) => ({
            ...prev,
            emails: prev.emails.filter((student) => student !== email),
        }));
    };

    const handleSubmit = async () => {
        const payload: AddStudentsRequest = {
            emails: students.emails
                .map((e) => e.trim().toLowerCase())
                .filter((e) => e.length > 0),
        };

        if (payload.emails.length === 0) return;

        setSubmitError(null);
        setSubmitting(true);
        try {
            const result = await Subject.addStudentsToSubject(payload, id);
            if (!result) {
                setSubmitError("Could not add students. Please try again.");
                return;
            }

            const alreadyEnrolled = result.alreadyEnrolled ?? [];
            const failed = result.failed ?? [];
            const success = result.success ?? [];

            if (success.length > 0) {
                onEnrollmentChanged?.();
            }

            if (alreadyEnrolled.length > 0 || failed.length > 0) {
                setSubmitFeedback({ alreadyEnrolled, failed, success });
            } else {
                onClose();
            }
        } catch (error) {
            console.error(error);
            setSubmitError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDismissResults = () => {
        setSubmitFeedback(null);
        onClose();
    };

    const count = students.emails.length;

    return (
        <Modal
            open={isModalOpen}
            onClose={onClose}
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.45)" } }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(520px, calc(100vw - 32px))",
                    maxHeight: "calc(100vh - 48px)",
                    overflow: "hidden",
                    bgcolor: "#fff",
                    borderRadius: "20px",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    outline: "none",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2.5,
                        py: 2,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "10px",
                                bgcolor: "primary.main",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <PersonAddAltRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#2b2b2b" }}>
                            Add Students
                        </Typography>
                    </Stack>
                    <IconButton
                        onClick={onClose}
                        size="small"
                        aria-label="Close"
                        sx={{ color: "grey.500" }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />

                {/* Body */}
                <Box sx={{ px: 2.5, py: 2.5, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    {submitError && (
                        <Alert severity="error" onClose={() => setSubmitError(null)}>
                            {submitError}
                        </Alert>
                    )}
                    {submitFeedback && submitFeedback.alreadyEnrolled.length > 0 && (
                        <Alert severity="warning">
                            {submitFeedback.alreadyEnrolled.length === 1
                                ? "This student is already enrolled in this subject:"
                                : "These students are already enrolled in this subject:"}{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                                {submitFeedback.alreadyEnrolled.join(", ")}
                            </Box>
                        </Alert>
                    )}
                    {submitFeedback && submitFeedback.failed.length > 0 && (
                        <Alert severity="error">
                            No account was found for:{" "}
                            <Box component="span" sx={{ fontWeight: 600 }}>
                                {submitFeedback.failed.join(", ")}
                            </Box>
                        </Alert>
                    )}
                    {submitFeedback && submitFeedback.success.length > 0 && (
                        <Alert severity="success">
                            Added {submitFeedback.success.length}{" "}
                            {submitFeedback.success.length === 1 ? "student" : "students"} successfully.
                        </Alert>
                    )}
                    <Box sx={{ display: submitFeedback ? "none" : "block" }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                            <MailOutlineIcon sx={{ fontSize: 18, color: "grey.600" }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#2b2b2b" }}>
                                Student Email
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            <TextField
                                fullWidth
                                placeholder="student@example.com"
                                value={newStudent}
                                onChange={(e) => {
                                    setNewStudent(e.target.value);
                                    if (emailError) setEmailError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddStudent();
                                    }
                                }}
                                error={!!emailError}
                                helperText={
                                    emailError ||
                                    "Use a valid address (name@domain.com). Separate several with commas or spaces."
                                }
                                FormHelperTextProps={{ sx: { mx: 0 } }}
                                InputProps={{
                                    sx: {
                                        borderRadius: "12px",
                                        bgcolor: "#fafafa",
                                        "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
                                    },
                                }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddStudent}
                                disabled={!hasInput}
                                sx={{
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    px: 2.5,
                                    minWidth: 88,
                                    height: 56,
                                    flexShrink: 0,
                                }}
                            >
                                Add
                            </Button>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 200,
                            display: submitFeedback ? "none" : "flex",
                            border: "1px dashed rgba(0,0,0,0.18)",
                            borderRadius: "14px",
                            bgcolor: "#fafafa",
                            p: 2,
                            flexDirection: "column",
                            alignItems: "stretch",
                            overflow: "hidden",
                        }}
                    >
                        {count === 0 ? (
                            <Box
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    py: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(0,0,0,0.06)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mb: 1.5,
                                    }}
                                >
                                    <PersonAddAltRoundedIcon sx={{ fontSize: 28, color: "grey.500" }} />
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: "grey.700" }}>
                                    No students added yet
                                </Typography>
                                <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5, maxWidth: 280 }}>
                                    Enter email addresses above to add students
                                </Typography>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    flex: 1,
                                    overflowY: "auto",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                    alignContent: "flex-start",
                                }}
                            >
                                {students.emails.map((email) => (
                                    <Chip
                                        key={email}
                                        label={email}
                                        onDelete={() => handleRemoveStudent(email)}
                                        deleteIcon={<CloseIcon sx={{ fontSize: 18 }} />}
                                        sx={{
                                            borderRadius: "10px",
                                            bgcolor: "#fff",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                            fontWeight: 500,
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />

                {/* Footer */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 2,
                        px: 2.5,
                        py: 2,
                    }}
                >
                    {submitFeedback ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleDismissResults}
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                            }}
                        >
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={onClose}
                                disabled={submitting}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    color: "grey.700",
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={count === 0 || submitting}
                                sx={{
                                    borderRadius: "12px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    px: 3,
                                }}
                            >
                                {submitting ? (
                                    <CircularProgress size={22} color="inherit" />
                                ) : (
                                    `Submit (${count})`
                                )}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default AddStudentsModal;
