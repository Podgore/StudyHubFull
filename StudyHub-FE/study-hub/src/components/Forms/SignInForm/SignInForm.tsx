import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import React, { useState } from "react";
import { useForm } from "react-hook-form"
import Auth from "../../../api/Auth";
import SignInRequest from "../../../api/models/request/Auth/SignInRequest";
import styles from './SignInForm.module.css';
import { yupResolver } from '@hookform/resolvers/yup';
import signInFormValidation from '../../../validation/SignInFormValidation';
import useNotification from "../../../hooks/useNotification";
import { useNavigate } from "react-router-dom";
import ForgotPasswordWindow from "../../ForgotPasswordWindow/ForgotPasswordWindow";

export interface SignIn {
    email: string;
    password: string;
}

const SignInForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { Notification } = useNotification();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<SignIn>({
        resolver: yupResolver(signInFormValidation),
        reValidateMode: 'onChange',
        mode: 'onTouched'
    });

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };


    const handleSignIn = async (data: SignIn) => {
        const response = await Auth.signIn(data as SignInRequest);

        if (response === undefined) {
            navigate(`/dashboard`);
        }
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    width: '60%',
                }}>
                <TextField
                    id="email"
                    label="Email"
                    variant="standard"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message || ' '}
                />
                <div className={styles.passwordContainer}>
                    <TextField
                        id="password"
                        label="Password"
                        variant="standard"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message || ' '}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <ForgotPasswordWindow />
                </div>
            </div >
            <div className={styles.buttonContainer}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSubmit(handleSignIn)}
                    sx={{
                        backgroundColor: '#D41A6D',
                        borderRadius: '24px',
                        textTransform: 'none',
                        py: 1.25,
                        fontSize: '1rem',
                        fontWeight: 600,
                    }}
                >
                    Sign In
                </Button>
            </div>
            <Notification />
        </>
    );
}

export default SignInForm;
