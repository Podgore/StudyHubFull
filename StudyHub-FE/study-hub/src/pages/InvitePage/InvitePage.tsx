import { useEffect, useState } from "react";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import PageHeader from "../../components/PageHeader/PageHeader";
import shell from "../../layouts/AuthenticatedShell.module.css";
import styles from "./InvitePage.module.css";
import UserResponse from "../../api/models/response/UserResponse";
import User from "../../api/User";
import DashboardInviteForm from "../../components/DashboardInviteForm/DashboardInviteForm";

const InvitePage = () => {
    const [user, setUser] = useState<UserResponse | undefined>(undefined);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await User.me();
                setUser(response);
            } catch (error) {
                console.error(error);
                setUser(undefined);
            }
        };

        fetchUser();
    }, []);
    return (
        <div className={shell.pageShell}>
            <PageHeader user={user} />
            <div className={shell.pageBody}>
                <ButtonsMenu activeView="invite" user={user} />
                <div className={`${styles.content} ${shell.mainScroll}`}>
                    <DashboardInviteForm />
                </div>
            </div>
        </div>
    );
}

export default InvitePage;