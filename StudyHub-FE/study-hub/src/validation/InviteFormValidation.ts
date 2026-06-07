import * as yup from 'yup';
import { InviteForm } from '../components/DashboardInviteForm/DashboardInviteForm';

const inviteFormValidation = yup.object<InviteForm>().shape({
    email: yup.string()
        .required('Email is required')
        .email('Email is invalid'),
});

export default inviteFormValidation;