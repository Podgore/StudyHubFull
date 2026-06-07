import { Typography } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';
import GradeIcon from '@mui/icons-material/Grade';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import styles from './ButtonsMenu.module.css';
import { useNavigate } from "react-router-dom";
import UserResponse from "../../api/models/response/UserResponse";


const ButtonsMenu = (props: { activeView: string, user: UserResponse | undefined }) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.clear();
        navigate('/');
    };

    const getItemClassName = (key: string) =>
        `${styles.button} ${props.activeView === key ? styles.active : ''}`;

    return (
        <div className={styles.menuBox}>
            <div className={styles.buttonBox} >
                <div
                    className={getItemClassName('dashboard')}
                    onClick={() => navigate('/dashboard')}>
                    <DashboardIcon sx={{ width: '30px', height: '30px' }} />
                    <Typography sx={{ fontSize: '20px' }}>Dashboard</Typography>
                </div>
                <div
                    className={getItemClassName('subjects')}
                    onClick={() => navigate('/subjects')}
                >
                    <AssignmentIcon sx={{ width: '30px', height: '30px' }} />
                    <Typography sx={{ fontSize: '20px' }}>Subjects</Typography>
                </div>
                {props.user?.role.toLowerCase() === 'student' && (
                    <div
                        className={getItemClassName('grades')}
                        onClick={() => navigate('/my-grades')}
                    >
                        <GradeIcon sx={{ width: '30px', height: '30px' }} />
                        <Typography sx={{ fontSize: '20px' }}>My Grades</Typography>
                    </div>
                )}
                {
                    (props.user?.role.toLowerCase() === 'teacher' || props.user?.role.toLowerCase() === 'admin') && (
                        <>
                            <div
                                className={getItemClassName('students')}
                                onClick={() => navigate('/students')}
                            >
                                <GroupsIcon sx={{ width: '30px', height: '30px' }} />
                                <Typography sx={{ fontSize: '20px' }}>Students</Typography>
                            </div>
                            <div
                                className={getItemClassName('invite')}
                                onClick={() => navigate('/invite-people')}
                            >
                                <PeopleAltIcon sx={{ width: '30px', height: '30px' }} />
                                <Typography sx={{ fontSize: '20px' }}>Invite people</Typography>
                            </div>
                        </>
                    )
                }
            </div>
            <div className={styles.settingsBox}>
                <div className={styles.line} />
                <div
                    className={getItemClassName('settings')}
                    onClick={() => navigate('/settings')}
                >
                    <SettingsIcon sx={{ width: '30px', height: '30px' }} />
                    <Typography sx={{ fontSize: '20px' }}>Settings</Typography>
                </div>
                <div
                    className={getItemClassName('sign-out')}
                    onClick={() => handleSignOut()}
                >
                    <ExitToAppIcon sx={{ width: '30px', height: '30px' }} />
                    <Typography sx={{ fontSize: '20px' }}>Sign out</Typography>
                </div>
            </div>
        </div>
    );
};

export default ButtonsMenu;