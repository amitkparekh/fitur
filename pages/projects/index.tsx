import React, { useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import Projects from "../../components/projects/Projects";
import styles from "../../styles/Home.module.scss";
import CreateProject from "../../components/projects/CreateProject";
import { useSession } from "next-auth/client";
import Sidebar from "../../components/sidebar/Sidebar";
import Redirect from "../../components/redirect/Redirect";

type CurrentTab = "Projects" | "Tasks";

const index = () => {
	const [session, isLoading] = useSession();
	const [currentTab, setCurrentTab] = React.useState<CurrentTab>("Projects");
	if (isLoading) return <p>Please wait...</p>;
	if (!session) return <Redirect to="/" />;

	return (
		<div className={styles.container}>
			<Navbar session={session} />
			<div className={styles.main__container}>
				{/* <CreateProject /> */}
				<div className={styles.sidebar__container}>
					<Sidebar
						currentTab={currentTab}
						setCurrentTab={setCurrentTab}
					/>
				</div>
				<div className={styles.projects__container}>
					{currentTab == "Projects" && <Projects />}
					{currentTab == "Tasks" && <h1>task</h1>}
				</div>
			</div>
		</div>
	);
};

export default index;
