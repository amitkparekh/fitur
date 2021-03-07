import React from "react";
import styles from "../../styles/projectCard/projectCard.module.scss";
import CreateTask from "../tasks/CreateTask";
import TaskCard from "../tasks/TaskCard";
import modalStyles from "../../styles/modal/taskModal.module.scss";
import EditTask from "../tasks/EditTask";
import Modal from "../modal/Modal";
import { useQuery, useQueryClient, useMutation } from "react-query";
import { fetcher } from "../../utils/fetcher";
import { CurrentTask } from "../../types/Task";
import OptionsIcon from "../../assets/OptionsIcon";
import Loading from "../loading/Loading";
import ProjectCardOptions from "../dropdown/projectCard/ProjectCardOptions";
import axios from "axios";
import {
	DragDropContext,
	Droppable,
	DropResult,
	Draggable,
} from "react-beautiful-dnd";

interface AppProps {
	projectID: string;
}

const ProjectCard = ({ projectID }: AppProps) => {
	const queryClient = useQueryClient();
	const [currentTask, setCurrentTask] = React.useState<CurrentTask | null>(
		null
	);
	const [currentProjectCardID, setCurrentProjectCardID] = React.useState("");

	const projectCardUrl = `/api/projectcards/${projectID}`;
	const { data: res, isLoading } = useQuery("projectCards", () =>
		fetcher(projectCardUrl)
	);

	const projectCardOrderMutation = useMutation((newProjectCardsOrder) =>
		axios.patch(
			`/api/projectcards-order/${projectID}`,
			newProjectCardsOrder
		)
	);

	if (isLoading) return <Loading color="white" />;

	const projectCardData = res?.data.project.projectCards;

	const projectCardOptionsHandler = (projectCardID: string) => {
		if (currentProjectCardID === projectCardID) {
			return setCurrentProjectCardID("");
		}
		setCurrentProjectCardID(projectCardID);
	};

	const onDragEnd = (result: DropResult) => {
		const { source, destination, draggableId, type } = result;
		if (!destination) {
			return;
		}

		if (
			destination.droppableId === source.droppableId &&
			source.index === destination.index
		) {
			return;
		}

		if (type === "column") {
			const newColumnOrder = Array.from(projectCardData);

			let temp = newColumnOrder[source.index];
			newColumnOrder[source.index] = newColumnOrder[destination.index];
			newColumnOrder[destination.index] = temp;

			// setting data on the client
			queryClient.setQueryData("projectCards", {
				data: { project: { projectCards: newColumnOrder } },
			});

			// console.log(newColumnOrder);

			//make call to the server with task id in projectCards
			const projectCardsID = newColumnOrder.map((projectCard) => {
				return projectCard._id;
			});

			projectCardOrderMutation.mutate({ projectCardsID });
			return;
		}

		const startColumn = projectCardData.find(
			(project) => project._id === source.droppableId
		);

		if (destination.droppableId === source.droppableId) {
			const newTasks = Array.from(startColumn.tasks);
			const movedTask = newTasks.splice(source.index, 1);

			newTasks.splice(destination.index, 0, movedTask[0]);

			const newColumn = { ...startColumn, tasks: newTasks };

			const newProjectCardData = projectCardData.map((projectCard) => {
				if (projectCard._id === source.droppableId) {
					return newColumn;
				}
				return projectCard;
			});

			// setting data on the client
			queryClient.setQueryData("projectCards", {
				data: { project: { projectCards: newProjectCardData } },
			});
			//make call to the server with task id in projectCards
			return;
		}

		const endColumn = projectCardData.find(
			(project) => project._id === destination.droppableId
		);

		const startTasks = Array.from(startColumn.tasks);
		const startMovedTasks = startTasks.splice(source.index, 1);
		const finalStart = startTasks.filter(
			(tasks) => tasks._id !== startMovedTasks[0]._id
		);
		const newStart = { ...startColumn, tasks: finalStart };

		const finnishedTasks = Array.from(endColumn.tasks);
		finnishedTasks.splice(destination.index, 0, startMovedTasks[0]);

		const newFinish = { ...endColumn, tasks: finnishedTasks };

		const newProjectCardData = projectCardData.map((projectCard) => {
			if (projectCard._id === source.droppableId) {
				return newStart;
			} else if (projectCard._id === destination.droppableId) {
				return newFinish;
			}

			return projectCard;
		});

		// setting data on the client
		queryClient.setQueryData("projectCards", {
			data: { project: { projectCards: newProjectCardData } },
		});

		//make call to the server with task id in projectCards
	};

	return (
		<>
			<DragDropContext onDragEnd={onDragEnd}>
				<Droppable
					droppableId="all-column"
					direction="horizontal"
					type="column"
				>
					{(provided) => (
						<div
							ref={provided.innerRef}
							{...provided.droppableProps}
							className={styles.projectCard_outer__container}
						>
							{projectCardData.map((projectCard, index) => (
								<Draggable
									draggableId={projectCard._id}
									index={index}
									key={projectCard._id}
								>
									{(provided) => (
										<div
											className={styles.container}
											ref={provided.innerRef}
											{...provided.draggableProps}
										>
											<div
												className={
													styles.title__container
												}
												{...provided.dragHandleProps}
											>
												<h4>{projectCard.name}</h4>
												<div
													className={
														styles.projectCard__options
													}
												>
													<div
														className={
															styles.option__icon
														}
														onClick={() =>
															projectCardOptionsHandler(
																projectCard._id
															)
														}
													>
														<OptionsIcon
															height={15}
															width={15}
															fill="#383838"
														/>
													</div>
													{currentProjectCardID ===
														projectCard._id && (
														<ProjectCardOptions
															projectCardID={
																projectCard._id
															}
															projectID={
																projectID
															}
															closeDropdown={
																setCurrentProjectCardID
															}
														/>
													)}
												</div>
											</div>
											<Droppable
												droppableId={projectCard._id}
												type="tasks"
											>
												{(provided) => (
													<div
														ref={provided.innerRef}
														{...provided.droppableProps}
														className={
															styles.tasks__container
														}
													>
														<TaskCard
															tasks={
																projectCard.tasks
															}
															setCurrentTask={
																setCurrentTask
															}
															projectCardName={
																projectCard.name
															}
														/>
														{provided.placeholder}
													</div>
												)}
											</Droppable>

											<CreateTask
												projectCardID={projectCard._id}
											/>
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>

			{currentTask?._id && (
				<Modal
					setCurrentTask={setCurrentTask}
					modalStyles={modalStyles}
				>
					<EditTask
						currentTask={currentTask}
						setCurrentTask={setCurrentTask}
					/>
				</Modal>
			)}
		</>
	);
};

export default ProjectCard;
