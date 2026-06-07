import { Box, Container, Link, Typography } from "@mui/material";
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <Box className={styles.footer} component="footer">
            <Typography variant="h5"
                sx={{
                    fontWeight: 'bold',
                    padding: '30px',
                }}>
                StudyHub
            </Typography>
            <Box className={styles.footerLinks}>
                <Box className={styles.linksColumn}>
                    <Typography variant="body1"
                        sx={{
                            fontWeight: 'bold',
                        }}>
                        Social
                    </Typography>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>GitHub</Link>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>YouTube</Link>
                </Box>
                <Box className={styles.linksColumn}>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>Get support</Link>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>Become a teacher</Link>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>Join as a student</Link>
                </Box>
                <Box className={styles.linksColumn}>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>About us</Link>
                    <Link href="#" color="inherit" sx={{ textDecoration: 'none' }}>Privacy</Link>
                </Box>
            </Box>
        </Box>
    );
}

export default Footer;