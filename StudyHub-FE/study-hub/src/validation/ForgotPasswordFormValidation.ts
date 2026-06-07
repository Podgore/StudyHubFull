import * as yup from 'yup';
import { ForgotPasswordForm } from '../components/ForgotPasswordWindow/ForgotPasswordWindow';

const ForgotPasswordFormValidation = yup.object<ForgotPasswordForm>().shape({
    email: yup.string()
        .required('Email is required')
        .email('Email is invalid'),
});

export default ForgotPasswordFormValidation;