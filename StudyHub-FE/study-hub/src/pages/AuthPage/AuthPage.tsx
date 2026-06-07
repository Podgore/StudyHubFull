import { Typography } from '@mui/material';
import AuthImg from '../../img/AuthImg.png';
import SignInForm from '../../components/Forms/SignInForm/SignInForm';
import SignUpForm from '../../components/Forms/SignUpForm/SignUpForm';
import styles from './AuthPage.module.css';

const AuthPage = ({ toRenderFullname }: { toRenderFullname: boolean }) => {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.formContainer}>
                <Typography className={styles.welcomeText} variant="h4" sx={{}}>
                    StudyHub
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    Welcome back!
                </Typography>
                {!toRenderFullname ? <SignInForm /> : <SignUpForm />}
            </div>
            <div className={styles.imageContainer}>
                <img src={AuthImg} alt="AuthImg" className={styles.authImg} />
            </div>
        </div>
    );
}

export default AuthPage