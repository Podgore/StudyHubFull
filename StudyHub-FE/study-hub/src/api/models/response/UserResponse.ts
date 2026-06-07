interface UserResponse {
    id: string;
    fullName: string;
    telegram: string;
    group?: string;
    course?: string;
    faculty?: string;   
    email: string;
    avatar?: string;
    role: string;
};

export default UserResponse;