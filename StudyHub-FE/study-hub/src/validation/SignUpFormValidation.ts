import * as yup from 'yup';
import { SignUp } from '../components/Forms/SignUpForm/SignUpForm';

const signInFormValidation = yup.object<SignUp>().shape({
    fullName: yup.string()
        .required('Full name is required'),
    email: yup.string()
        .required('Email is required')
        .email('Email is invalid'),
    password: yup.string()
        .required('Password is required')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/\d/, 'Password must contain at least one digit')
        .matches(/[@$!%*#?&-=()\\.,:;]/, 'Password must contain at least one special character')
        .min(8, 'Password must be at least 8 characters'),
});

export default signInFormValidation;