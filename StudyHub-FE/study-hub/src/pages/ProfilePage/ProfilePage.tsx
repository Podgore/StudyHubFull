import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import UserResponse from "../../api/models/response/UserResponse";
import User from "../../api/User";
import Profile from "../../components/Profile/Profile";
import PageHeader from "../../components/PageHeader/PageHeader";
import shell from "../../layouts/AuthenticatedShell.module.css";

const ProfilePage = () => {
    const [user, setUser] = useState<UserResponse>();

    useEffect(() => {
        const me = async () => {
            const response = await User.me();
            setUser(response);
        };
        void me();
    }, []);

    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="" user={user} />
                <Box className={shell.mainScroll} sx={{ bgcolor: "#f1f5f9", flex: 1 }}>
                    <Profile user={user} />
                </Box>
            </div>
        </div>
    );
};

export default ProfilePage;