import { Box, Typography } from "@mui/material";
import ResetPasswordForm from "../../../components/Forms/ResetPasswordForm/ResetPasswordForm";
import styles from './ForgotPasswordPage.module.css';

const ForgotPasswordPage = () => {
    return (
        <Box className={styles.forgotPasswordBox}>
            <Box>
            </Box>
            <Box className={styles.formBox}>
                <Typography variant="h3"
                    sx={{
                        fontWeight: 'bold',
                    }}>
                    Reset password
                </Typography>
                <ResetPasswordForm />
            </Box>
        </Box>
    );
};

export default ForgotPasswordPage;