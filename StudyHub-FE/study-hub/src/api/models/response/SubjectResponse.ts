import UserResponse from "./UserResponse";

interface SubjectResponse {
    id: string;
    teacher: UserResponse;
    title: string;
}

export default SubjectResponse;