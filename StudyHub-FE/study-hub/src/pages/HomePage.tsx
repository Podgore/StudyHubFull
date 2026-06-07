import Header from "../components/Header/Header";
import teacher from '../img/Teacher.png';
import student from '../img/Student.png';
import Footer from "../components/Footer/Footer";
import { Box, Typography } from "@mui/material";
import HomeCard from "../components/HomeCard/HomeCard";

const HomePage = () => {
    return (
        <>
            <Header />
            <Box>
                <Typography variant="h5" sx={{
                    fontWeight: 'bold',
                    padding: '50px 50px 0 50px',
                }}>
                    Welcome to StudyHub!
                </Typography>

                <HomeCard
                    img={student}
                    lable="As a student"
                    text="Access and take tests for specific subjects. Enhance your knowledge and improve your grades." />
                <HomeCard
                    img={teacher}
                    lable="As a teacher"
                    text="Invite and add students to courses. Manage and track student performance easily." />
            </Box>
            <Footer />
        </>
    )
}

export default HomePage;