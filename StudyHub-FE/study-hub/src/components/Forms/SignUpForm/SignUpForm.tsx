import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import React, { useState } from "react";
import { useForm } from "react-hook-form"
import Auth from "../../../api/Auth";
import styles from './SignUpForm.module.css';
import { yupResolver } from '@hookform/resolvers/yup';
import signUpFormValidation from '../../../validation/SignUpFormValidation';
import useNotification from "../../../hooks/useNotification";
import { useNavigate, useParams } from "react-router-dom";
import SignUpRequest from "../../../api/models/request/Auth/SignUpRequest";

export interface SignUp {
    fullName: string;
    email: string;
    password: string;
}

const SignUpForm = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const [showPassword, setShowPassword] = useState(false);
    const { Notification } = useNotification();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<SignUp>({
        resolver: yupResolver(signUpFormValidation),
        reValidateMode: 'onChange',
        mode: 'onTouched'
    });

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleSignUp = async (form: SignUp) => {
        const data = form as SignUpRequest;
        data.token = token == undefined ? '' : encodeURIComponent(token);
        console.log(data);
        const response = await Auth.signUp(data);
        if (response === undefined) {
            navigate('/');
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
                    id="fullName"
                    label="Full Name"
                    variant="standard"
                    {...register('fullName')}
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message || ' '}
                />
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
                </div>
            </div>
            <div className={styles.buttonContainer}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSubmit(handleSignUp)}
                    sx={{
                        backgroundColor: '#D41A6D',
                        borderRadius: '24px',
                        textTransform: 'none',
                        py: 1.25,
                        fontSize: '1rem',
                        fontWeight: 600,
                    }}
                >
                    Sign Up
                </Button>
            </div>
            <Notification />
        </>
    );
}

export default SignUpForm;
