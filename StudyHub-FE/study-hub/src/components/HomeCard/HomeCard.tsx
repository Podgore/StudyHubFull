import { Box, Typography, Button, Link } from "@mui/material"
import styles from './HomeCard.module.css'

const HomeCard = (props: { img: string, lable: string, text: string }) => {
    return (
        <Box className={styles.homeCard}>
            <Box>
                <img src={props.img} alt="student" className={styles.img}/>
            </Box>
            <Box className={styles.homeCardText}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {props.lable}
                </Typography>
                <Typography
                    sx={{
                        fontSize: '30px',
                        width: '350px',
                    }}>
                    {props.text}
                </Typography>
                <Link href="/sign-in" color="primary" 
                 sx={{
                        backgroundColor: '#000000',
                        borderRadius: '24px',
                        padding: '10px 50px',
                        color: 'white',
                        width: '200px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        '&:hover': {
                            backgroundColor: '#1F1F1F',
                        }

                    }}>
                    Join now
                </Link>
            </Box>
        </Box>
    )
}

export default HomeCard