interface ResetPasswordRequest {
    resetToken: string;
    email: string;
    newPassword: string;
    confirmPassword: string;
}

export default ResetPasswordRequest;