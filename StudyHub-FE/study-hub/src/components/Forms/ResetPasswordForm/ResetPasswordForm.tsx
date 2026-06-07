import { Box, Button, IconButton, InputAdornment, TextField } from "@mui/material";
import styles from './ResetPasswordForm.module.css';
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import useNotification from "../../../hooks/useNotification";
import ResetPasswordFormValidation from "../../../validation/ResetPasswordFormValidation";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import ResetPasswordRequest from "../../../api/models/request/Auth/ResetPasswordRequest";
import Auth from "../../../api/Auth";

export interface ResetPassword {
    email: string;
    newPassword: string;
    confirmPassword: string;
}


const ResetPasswordForm = () => {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();
    const { Notification } = useNotification();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ResetPassword>({
        resolver: yupResolver(ResetPasswordFormValidation),
        reValidateMode: 'onChange',
        mode: 'onTouched'
    });

    const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
    const handleMouseDownNewPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
    const handleMouseDownConfirmPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleResetPassword = async (form: ResetPassword) => {
        const data = form as ResetPasswordRequest;
        data.resetToken = token == undefined ? '' : encodeURIComponent(token);
        const response = await Auth.resetPassword(data);
        if (response === undefined) {
            navigate('/sign-in'); 
        }
    };

    return (
        <Box className={styles.formBox}>
            <TextField
                label="Email"
                variant="outlined"
                className={styles.field}
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message || ' '} />
            <Box>
                <TextField
                    className={styles.field}
                    label="New password"
                    variant="outlined"
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword?.message || ' '}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowNewPassword}
                                    onMouseDown={handleMouseDownNewPassword}
                                >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <Box>
                <TextField
                    className={styles.field}
                    label="Confim Password"
                    variant="outlined"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message || ' '}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowConfirmPassword}
                                    onMouseDown={handleMouseDownConfirmPassword}
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <Button
                variant="contained"
                color="primary"
                className={styles.button}
                onClick={handleSubmit(handleResetPassword)}
                sx={{
                    borderRadius: '24px',
                }}>
                Reset Password
            </Button>
            <Notification />
        </Box>
    );
}

export default ResetPasswordForm;