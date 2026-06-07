import * as React from 'react';
import Button from '@mui/material/Button';
import useNotification from '../../hooks/useNotification';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { parseDurationHhMmSsToMs, pickerDayjsToOffsetIsoString } from '../../utils/assignmentDateTimeForm';
import { useNavigate, useParams } from 'react-router-dom';
import Assignment from '../../api/Assignment';
import { useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createAssignmentValidationSchema } from '../../validation/CreateAssignmentValidationSchema';
import { CreateAssignmentRequest } from '../../api/models/request/Assignment/CreateAssignmentRequest';
import {
    AssignmentFormModalLayout,
    AssignmentModalFieldRow,
} from './AssignmentFormModalLayout';
import Lecture from '../../api/Lecture';
import type { LectureResponse } from '../../api/models/response/LectureResponse';
import { AssignmentKind } from '../../api/models/response/AssignmentResponse';

export interface CreateAssignment {
    title: string;
    maxMark: number;
    openingDate: string;
    closingDate: string;
    duration: string;
    kind: number;
    instructions: string;
    lectureId: string;
}

export interface NewAssignmentModalProps {
    onAssignmentCreated?: () => void | Promise<void>;
}

const popperStopPropagation = {
    popper: {
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    },
};

const fieldInputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
    },
};

const defaultForm: CreateAssignment = {
    title: '',
    maxMark: 10,
    openingDate: '',
    closingDate: '',
    duration: '01:00:00',
    kind: AssignmentKind.TimedTest,
    instructions: '',
    lectureId: '',
};

const NewAssignmentModal = ({ onAssignmentCreated }: NewAssignmentModalProps) => {
    const [open, setOpen] = React.useState(false);
    const [lectures, setLectures] = React.useState<LectureResponse[]>([]);
    const { notifySuccess } = useNotification();
    const navigate = useNavigate();
    const { id: subjectId } = useParams<{ id: string }>();

    const handleClose = () => setOpen(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
        trigger,
    } = useForm<CreateAssignment>({
        resolver: yupResolver(createAssignmentValidationSchema) as Resolver<CreateAssignment>,
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: defaultForm,
    });

    const kindWatch = watch('kind');
    const openingDateWatch = watch('openingDate');
    const durationWatch = watch('duration');

    const closingMinDateTime = React.useMemo(() => {
        if (!openingDateWatch) return dayjs();
        const open = dayjs(openingDateWatch);
        if (!open.isValid()) return dayjs();
        if (kindWatch === AssignmentKind.Homework) {
            return open.add(1, 'second');
        }
        const durMs = parseDurationHhMmSsToMs(durationWatch || '00:00:00');
        if (durMs == null || durMs <= 0) return open.add(1, 'second');
        return open.add(durMs, 'millisecond');
    }, [openingDateWatch, durationWatch, kindWatch]);

    const durationRegister = register('duration');

    const handleOpen = async () => {
        reset(defaultForm);
        if (subjectId) {
            const list = await Lecture.getLecturesBySubject(subjectId);
            setLectures(list ?? []);
        }
        setOpen(true);
    };

    const handleCreateAssignment = async (data: CreateAssignment) => {
        try {
            const payload: CreateAssignmentRequest = {
                title: data.title,
                maxMark: Number(data.maxMark),
                openingDate: data.openingDate,
                closingDate: data.closingDate,
                duration: data.duration,
                subjectId: subjectId!,
                kind: data.kind,
                instructions: data.kind === AssignmentKind.Homework ? data.instructions || null : null,
                lectureId:
                    data.kind === AssignmentKind.Homework && data.lectureId ? data.lectureId : null,
            };

            const responce = await Assignment.createAssignment(payload);
            notifySuccess('Assignment created successfully!');
            handleClose();
            await onAssignmentCreated?.();
            if (data.kind === AssignmentKind.Homework) {
                navigate(`/subject/${subjectId}/course-task/${responce.id}`);
            } else {
                navigate(`/subject/${subjectId}/assignment-creator/${responce.id}`);
            }
        } catch {
            /* Server message shown via global API handler */
        }
    };

    return (
        <>
            <AssignmentFormModalLayout
                open={open}
                onClose={handleClose}
                title="Create Assignment"
                mode="create"
                primaryLabel="Create assignment"
                onPrimaryClick={() => handleSubmit(handleCreateAssignment)()}
            >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <AssignmentModalFieldRow
                        icon={<DescriptionOutlinedIcon />}
                        label="Type"
                    >
                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            value={kindWatch}
                            onChange={(_, v) => {
                                if (v == null) return;
                                setValue('kind', v, { shouldValidate: true });
                                if (v === AssignmentKind.Homework) {
                                    setValue('duration', '00:00:00');
                                    setValue('maxMark', 0);
                                } else {
                                    setValue('duration', '01:00:00');
                                    setValue('maxMark', 10);
                                }
                                void trigger('closingDate');
                            }}
                            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600 } }}
                        >
                            <ToggleButton value={AssignmentKind.TimedTest}>Online test</ToggleButton>
                            <ToggleButton value={AssignmentKind.Homework}>Homework / task</ToggleButton>
                        </ToggleButtonGroup>
                    </AssignmentModalFieldRow>

                    <AssignmentModalFieldRow icon={<DescriptionOutlinedIcon />} label="Name">
                        <TextField
                            id="assignment-name"
                            variant="outlined"
                            fullWidth
                            placeholder="Assignment name"
                            sx={fieldInputSx}
                            {...register('title')}
                            error={!!errors.title}
                            helperText={errors.title?.message}
                        />
                    </AssignmentModalFieldRow>

                    <AssignmentModalFieldRow
                        icon={
                            <Typography
                                component="span"
                                sx={{ fontSize: '1.1rem', fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}
                            >
                                #
                            </Typography>
                        }
                        label="Mark"
                    >
                        <TextField
                            id="assignment-mark"
                            variant="outlined"
                            fullWidth
                            type="number"
                            sx={fieldInputSx}
                            {...register('maxMark')}
                            error={!!errors.maxMark}
                            helperText={errors.maxMark?.message}
                        />
                    </AssignmentModalFieldRow>

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            mb: 2.5,
                        }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <AssignmentModalFieldRow icon={<EventOutlinedIcon />} label="Assignment start">
                                <DateTimePicker
                                    minDateTime={dayjs()}
                                    value={watch('openingDate') ? dayjs(watch('openingDate')) : null}
                                    onChange={(newValue) => {
                                        setValue('openingDate', newValue ? pickerDayjsToOffsetIsoString(newValue) : '', {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                        void trigger('closingDate');
                                    }}
                                    slotProps={{
                                        ...popperStopPropagation,
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined',
                                            sx: fieldInputSx,
                                            error: !!errors.openingDate,
                                            helperText: errors.openingDate?.message,
                                        },
                                    }}
                                />
                            </AssignmentModalFieldRow>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <AssignmentModalFieldRow icon={<EventOutlinedIcon />} label="Assignment end">
                                <DateTimePicker
                                    minDateTime={closingMinDateTime}
                                    value={watch('closingDate') ? dayjs(watch('closingDate')) : null}
                                    onChange={(newValue) =>
                                        setValue('closingDate', newValue ? pickerDayjsToOffsetIsoString(newValue) : '', {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        })
                                    }
                                    slotProps={{
                                        ...popperStopPropagation,
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined',
                                            sx: fieldInputSx,
                                            error: !!errors.closingDate,
                                            helperText: errors.closingDate?.message,
                                        },
                                    }}
                                />
                            </AssignmentModalFieldRow>
                        </Box>
                    </Box>

                    <AssignmentModalFieldRow icon={<AccessTimeOutlinedIcon />} label="Duration (hh:mm:ss)">
                        <TextField
                            id="assignment-duration"
                            variant="outlined"
                            fullWidth
                            placeholder="02:30:00"
                            sx={fieldInputSx}
                            {...durationRegister}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                durationRegister.onChange(e);
                                void trigger('closingDate');
                            }}
                            error={!!errors.duration}
                            disabled={kindWatch === AssignmentKind.Homework}
                            helperText={
                                errors.duration?.message ??
                                (kindWatch === AssignmentKind.Homework
                                    ? 'Not used for homework (kept at 00:00:00)'
                                    : 'Format: hours:minutes:seconds (e.g., 02:30:00)')
                            }
                        />
                    </AssignmentModalFieldRow>

                    {kindWatch === AssignmentKind.Homework && (
                        <>
                            <AssignmentModalFieldRow icon={<DescriptionOutlinedIcon />} label="Linked lecture">
                                <FormControl fullWidth sx={fieldInputSx}>
                                    <InputLabel id="assignment-lecture-label">Optional</InputLabel>
                                    <Select
                                        labelId="assignment-lecture-label"
                                        label="Optional"
                                        value={watch('lectureId') || ''}
                                        onChange={(e) =>
                                            setValue('lectureId', e.target.value as string, {
                                                shouldValidate: true,
                                            })
                                        }
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {lectures.map((lec) => (
                                            <MenuItem key={lec.id} value={String(lec.id)}>
                                                {lec.title}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </AssignmentModalFieldRow>
                            <AssignmentModalFieldRow icon={<DescriptionOutlinedIcon />} label="Instructions">
                                <TextField
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    placeholder="What students should do, deadlines, etc."
                                    sx={fieldInputSx}
                                    {...register('instructions')}
                                    error={!!errors.instructions}
                                    helperText={errors.instructions?.message}
                                />
                            </AssignmentModalFieldRow>
                        </>
                    )}
                </LocalizationProvider>
            </AssignmentFormModalLayout>

            <Button
                onClick={handleOpen}
                sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'primary.main',
                }}
            >
                Add new Assignment
            </Button>
        </>
    );
};

export default NewAssignmentModal;
