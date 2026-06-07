import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import styles from './DashboardPage.module.css';
import { useEffect, useState } from "react";
import UserResponse from "../../api/models/response/UserResponse";
import User from "../../api/User";
import PageHeader from "../../components/PageHeader/PageHeader";
import DashboardHome from "./DashboardHome";
import shell from "../../layouts/AuthenticatedShell.module.css";

const DashboardPage = () => {
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
        <ButtonsMenu activeView="dashboard" user={user} />
        <div
          className={`${styles.contentBox} ${shell.mainScroll} ${styles.dashboardMain}`}
        >
          <DashboardHome user={user} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;