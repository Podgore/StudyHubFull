import { Box, Button, Card, FormControlLabel, InputBase, Paper, Radio, RadioGroup, Typography, styled } from "@mui/material";
import Chip from '@mui/material/Chip';
import styles from './DashboardInviteForm.module.css';
import { useForm } from "react-hook-form";
import inviteFormValidation from "../../validation/InviteFormValidation";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import useNotification from "../../hooks/useNotification";
import User from "../../api/User";
import InviteUserRequest from "../../api/models/request/User/InviteUserRequest";

export interface InviteForm {
    emails: string[];
    role: string;
}

const ListItem = styled('li')(({ theme }) => ({
    margin: theme.spacing(0.5),
}));

const DashboardInviteForm = () => {
    const [invite, setInvite] = useState<{ email: string }[]>([]);
    const { notifyError, notifySuccess, Notification } = useNotification();
    const [role, setRole] = useState<string>('Student');
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(inviteFormValidation),
        mode: 'onTouched'
    });

    const handleAdd = (data: { email: string }) => {
        setInvite((currentInvites) => [...currentInvites, data]);
        reset();
    };

    const handleDelete = (emailToDelete: string) => () => {
        setInvite((currentInvites) => currentInvites.filter((invite) => invite.email !== emailToDelete));
    };

    const handleInvite = async () => {
        const inviteData: InviteForm = {
            emails: invite.map((data) => data.email),
            role: role
        }
        const response = await User.inviteUser(inviteData as InviteUserRequest);
        if (response?.failed && response.failed.length > 0) {
            response.failed.map((error) => notifyError(`Enable to invite ${error}`));
        }
        else if (response?.success) {
            notifySuccess('Invited successfully');
            setInvite([]);
        }
        else {
            notifyError('Something went wrong');
        }
    };

    return (
        <>
            <Card className={styles.inviteCard} sx={{ borderRadius: '24px' }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Invite someone into StudyHub system
                </Typography>
                <Box className={styles.inputBox}>
                    <Paper
                        component="form"
                        className={styles.inputPaper}
                        sx={{ borderRadius: '999px', backgroundColor: '#f1f2f4' }}
                    >
                        <InputBase
                            {...register('email')}
                            sx={{ ml: 2, flex: 1 }}
                            placeholder="Input email"
                            autoComplete="off"
                        />
                    </Paper>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ borderRadius: '999px', textTransform: 'none', px: 3 }}
                        onClick={handleSubmit(handleAdd)}
                        className={styles.button}
                    >
                        Add
                    </Button>
                </Box>
                <Box
                    className={styles.chipBox}
                    sx={{ p: 0.5 }}
                    component="ul"
                >
                    {invite.map((data, index) => (
                        <ListItem key={index}>
                            <Chip
                                color="primary"
                                label={data.email}
                                onDelete={handleDelete(data.email)}
                            />
                        </ListItem>
                    ))}
                </Box>
                <RadioGroup
                    row
                    defaultValue="Student"
                    onChange={(e) => setRole(e.target.value)}
                    sx={{ justifyContent: 'center' }}
                >
                    <FormControlLabel value="Student" control={<Radio />} label="Student" />
                    <FormControlLabel value="Teacher" control={<Radio />} label="Teacher" />
                    <FormControlLabel value="Admin" control={<Radio />} label="Admin" />
                </RadioGroup>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: '999px', textTransform: 'none' }}
                    className={styles.button}
                    onClick={handleInvite}>
                    Invite
                </Button>
            </Card>
            <Notification />
        </>
    );
};

export default DashboardInviteForm;
