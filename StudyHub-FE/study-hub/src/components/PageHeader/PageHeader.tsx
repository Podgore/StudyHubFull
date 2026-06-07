import { Avatar, IconButton, Typography } from "@mui/material"
import styles from "./PageHeader.module.css";
import { useNavigate } from "react-router-dom";
import UserResponse from "../../api/models/response/UserResponse";
import profile from '../../img/Profile.png';
import { API_ORIGIN } from "../../config/apiOrigin";

const PageHeader = (props: { user: UserResponse | undefined }) => {
    const navigate = useNavigate();
    return (
        <div className={styles.contentBox}>
            <Typography variant="h4" sx={{ paddingLeft: "1.5%" }}>
                StudyHub
            </Typography>
            <div className={styles.profileBox}>
                <IconButton size="medium"
                    onClick={() => navigate('/profile')}>
                    <Avatar
                        sx={{ width: 40, height: 40 }}
                        src={props.user?.avatar?.trim() ? `${API_ORIGIN}${props.user.avatar.startsWith("/") ? props.user.avatar : `/${props.user.avatar}`}` : profile}
                        imgProps={{
                            onError: (e) => {
                                const el = e.currentTarget;
                                if (el.getAttribute("data-img-fallback") !== "1") {
                                    el.setAttribute("data-img-fallback", "1");
                                    el.src = profile;
                                }
                            },
                        }}
                    >M</Avatar>
                </IconButton>
                <div>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                        }}>
                        {props.user?.fullName}
                    </Typography>
                    <Typography sx={{ fontSize: '11px' }}>{props.user?.email}</Typography>
                </div>
            </div>
        </div>
    );
}

export default PageHeader;