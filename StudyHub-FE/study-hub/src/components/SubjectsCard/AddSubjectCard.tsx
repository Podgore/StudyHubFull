import { Button, Card, CardContent, Typography, Box, Modal, IconButton, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Subject from "../../api/Subject";

type AddSubjectCardProps = {
    variant?: "card" | "button";
    onCreated?: () => void;
};

const AddSubjectCard = ({ variant = "card", onCreated }: AddSubjectCardProps) => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const navigate = useNavigate();

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setTitle("");
    };

    const handleCreateSubject = async () => {
        try {
            const trimmed = title.trim();
            if (!trimmed) return;

            const response = await Subject.createSubject({ title: trimmed });
            onCreated?.();
            navigate(`/subject/${response.id}`);
        } catch (error) {
            console.error("Failed to create subject:", error);
            alert("An error occurred while creating the subject. Please try again.");
        }
    };

    return (
        <>
            {variant === "button" ? (
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpen}
                    sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2.5,
                    }}
                >
                    Add Subject
                </Button>
            ) : (
                <Card
                    sx={{
                        backgroundColor: "#f0f0f0",
                        minHeight: "20rem",
                        maxHeight: "25rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "transform 0.2s ease-in-out",
                        "&:hover": {
                            transform: "scale(1.02)",
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                        },
                    }}
                    onClick={handleOpen}
                >
                    <CardContent>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                width: "100%",
                            }}
                        >
                            <IconButton
                                sx={{
                                    fontSize: "3rem",
                                    color: "#888",
                                }}
                            >
                                <AddIcon fontSize="inherit" />
                            </IconButton>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Modal
                open={open}
                onClose={handleClose}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Box
                    sx={{
                        width: 400,
                        bgcolor: "background.paper",
                        borderRadius: "8px",
                        boxShadow: 24,
                        p: 4,
                        outline: "none",
                    }}
                >
                    <Typography variant="h6" component="h2">
                        Add New Subject
                    </Typography>
                    <TextField
                        label="Name"
                        variant="outlined"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateSubject();
                            }
                        }}
                        sx={{
                            width: '100%',
                            marginTop: '10px',
                            marginBottom: '30px'
                        }} />
                    <div style={{ display: "flex", flexDirection: "row", gap: "15px" }}>
                        <Button
                            variant="contained"
                            onClick={handleClose}
                            sx={{
                                borderRadius: '12px',
                                width: '100%',
                                height: '50px',
                                backgroundColor: '#ffffff',
                                color: '#080808',
                                textTransform: 'none',
                                ":hover": {
                                    color: '#ffffff',
                                }
                            }}>
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateSubject}
                            disabled={!title.trim()}
                            sx={{
                                borderRadius: '12px',
                                width: '100%',
                                height: '50px'
                            }}>
                            Create Subject
                        </Button>
                    </div>
                </Box>
            </Modal>
        </>
    );
};

export default AddSubjectCard;
