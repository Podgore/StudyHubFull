import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { TextField } from '@mui/material';
import styles from './ForgotPasswordWindow.module.css';
import useNotification from '../../hooks/useNotification';
import { useForm } from 'react-hook-form';
import ForgotPasswordFormValidation from '../../validation/ForgotPasswordFormValidation';
import { yupResolver } from '@hookform/resolvers/yup';
import Auth from '../../api/Auth';

export interface ForgotPasswordForm {
    email: string;
}

const ForgotPasswordWindow = () => {
    const [open, setOpen] = React.useState(false);
    const { notifySuccess, Notification } = useNotification();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ForgotPasswordForm>({
        resolver: yupResolver(ForgotPasswordFormValidation),
        reValidateMode: 'onChange',
        mode: 'onTouched'
    });
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleForgotPassword = async (data: ForgotPasswordForm) => {
        const response = await Auth.forgotPassword(data.email);
        if (response === undefined) {
            setOpen(false);
            notifySuccess('Password reset email sent');
        }
    };

    return (
        <>
            <Modal
                aria-labelledby="transition-modal-title"
                aria-describedby="transition-modal-description"
                open={open}
                onClose={handleClose}
                closeAfterTransition
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        timeout: 500,
                    },
                }}
            >
                <Fade in={open}>
                    <div className={styles.fradeBox}>
                        <Typography id="transition-modal-title" variant="h4"
                            sx={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                            }}>
                            Forgot Password
                        </Typography>
                        <Typography id="spring-modal-description" variant="h6" style={{
                            fontWeight: 'lighter',
                            textAlign: 'center',
                            marginTop: '4px'
                        }}>
                            No worries, We'll send you instructions for reset
                        </Typography>
                        <div className={styles.formBox}>
                            <TextField
                                label="Email"
                                variant="outlined"
                                {...register('email')}
                                error={!!errors.email}
                                helperText={errors.email?.message || ' '}
                                sx={{
                                    width: '100%',
                                    marginTop: '35px'
                                }} />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit(handleForgotPassword)}
                                sx={{
                                    borderRadius: '12px',
                                    width: '100%',
                                    height: '50px'
                                }}>
                                Reset Password
                            </Button>
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
                        </div>
                    </div>
                </Fade>
            </Modal >
            <Button
                onClick={handleOpen}
                sx={{
                    display: 'flex',
                    color: '#000000',
                    alignSelf: 'flex-end',
                    padding: '0px',
                    textTransform: 'none',
                    ":hover": {
                        backgroundColor: 'transparent',
                        color: '#D41A6D',
                        textDecoration: 'underline',
                    }
                }}>
                Forgot password?
            </Button>
            <Notification />
        </>
    );
}

export default ForgotPasswordWindow;