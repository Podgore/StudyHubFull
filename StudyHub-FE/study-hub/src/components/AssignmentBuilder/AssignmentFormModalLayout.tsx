import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { Box, Button, Divider, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';

export const ASSIGNMENT_MODAL_ACCENT = '#D41A6D';

interface AssignmentFormModalLayoutProps {
    open: boolean;
    onClose: () => void;
    title: string;
    mode: 'edit' | 'create';
    children: React.ReactNode;
    onPrimaryClick: () => void;
    primaryLabel: string;
    cancelLabel?: string;
    primaryDisabled?: boolean;
}

export function AssignmentFormModalLayout({
    open,
    onClose,
    title,
    mode,
    children,
    onPrimaryClick,
    primaryLabel,
    cancelLabel = 'Cancel',
    primaryDisabled,
}: AssignmentFormModalLayoutProps) {
    const HeaderIcon = mode === 'edit' ? EditNoteIcon : NoteAddOutlinedIcon;

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
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'min(calc(100vw - 32px), 560px)',
                        maxHeight: 'calc(100vh - 32px)',
                        overflow: 'auto',
                        bgcolor: 'background.paper',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        outline: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2.5,
                            py: 2,
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                bgcolor: ASSIGNMENT_MODAL_ACCENT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <HeaderIcon sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, flex: 1, fontSize: '1.125rem' }}>
                            {title}
                        </Typography>
                        <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Divider sx={{ borderColor: 'divider' }} />
                    <Box sx={{ px: 2.5, py: 2.5 }}>{children}</Box>
                    <Divider sx={{ borderColor: 'divider' }} />
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: 1,
                            px: 2.5,
                            py: 2,
                        }}
                    >
                        <Button
                            variant="text"
                            onClick={onClose}
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                fontWeight: 600,
                            }}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={onPrimaryClick}
                            disabled={primaryDisabled}
                            sx={{
                                bgcolor: ASSIGNMENT_MODAL_ACCENT,
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: '10px',
                                px: 2.5,
                                py: 1,
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: '#b01557',
                                    boxShadow: 'none',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: 'action.disabledBackground',
                                },
                            }}
                        >
                            {primaryLabel}
                        </Button>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
}

interface FieldRowProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}

export function AssignmentModalFieldRow({ icon, label, children }: FieldRowProps) {
    return (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', color: 'text.secondary', '& svg': { fontSize: 20 } }}>{icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {label}
                </Typography>
            </Box>
            {children}
        </Box>
    );
}
