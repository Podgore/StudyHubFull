import { Box, Link, Typography } from "@mui/material";
import mainTop from '../../img/MainTop.png';
import mainBottom from '../../img/MainBottom.png';
import Search from "../Search/Search";
import styles from './Header.module.css';

const Header = () => {
    return (
        <Box className={styles.header} component="header">
            <Box className={styles.headerTop}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 'bold',
                    }}>
                    Study Hub
                </Typography>
                <Link href="/sign-in"
                    sx={{
                        backgroundColor: '#000000',
                        borderRadius: '24px',
                        padding: '10px 50px',
                        color: 'white',
                        textAlign: 'center',
                        textDecoration: 'none',
                        '&:hover': {
                            backgroundColor: '#1F1F1F',
                        }

                    }}>Sign In</Link>
            </Box>
            <Box className={styles.headerContent}
            >
                <img className={styles.imgTop} src={mainTop} alt="mainTop" />
                <Typography variant="h2" align="center"
                    sx={{
                        width: '900px',
                        fontWeight: 'medium',
                        border: '2px solid #000000',
                        padding: '40px',
                    }}>The easiest way to access and take tests for specific subjects</Typography>
                <img className={styles.imgBottom} src={mainBottom} alt="mainBottom" />
            </Box>
            <Search />
        </Box>
    );
}

export default Header;