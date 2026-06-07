import { Box, Typography, Card, Button, Avatar } from "@mui/material";
import styles from './ProfileMenu.module.css';
import UserResponse from "../../api/models/response/UserResponse";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AssignmentResponse from "../../api/models/response/AssignmentResponse";
import Assignment from "../../api/Assignment";

function splitDateTime(dateTime: Date) {
    const dateString = dateTime.toLocaleDateString("en", {
        year: "numeric",
        day: "2-digit",
        month: "long",
    });

    const timeString = dateTime.toLocaleTimeString();

    return (
        <div>
            <div>{dateString}</div>
            <div>{timeString}</div>
        </div>
    );
}

const ProfileMenu = (props: { user: UserResponse | undefined }) => {
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<AssignmentResponse | undefined>();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await Assignment.getNextAssignment();
                setAssignments(response);
            } catch (error) {
                console.error(error);
            }
        };

        fetchAssignments();
    }, []);
    return (
        <Box className={styles.profileBox}>
            <Typography sx={{
                fontSize: '20px',
                fontWeight: 'bold',
                alignSelf: 'flex-start',
            }}>Profile</Typography>


        </Box>
    );
};

export default ProfileMenu;