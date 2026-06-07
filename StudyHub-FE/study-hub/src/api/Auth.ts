import AuthSuccessResponse from "./models/response/AuthSuccessResponse";
import SignInRequest from "./models/request/Auth/SignInRequest";
import API from "./repository/Api";
import SignUpRequest from "./models/request/Auth/SignUpRequest";
import ResetPasswordRequest from "./models/request/Auth/ResetPasswordRequest";
import RefreshTokenRequest from "./models/request/Auth/RefreshTokenRequest";
import { extractServerErrorMessage } from "../utils/apiErrorMessage";

const Auth = {
    signIn: async (request: SignInRequest): Promise<any> => {
        const response = await API.post<SignInRequest, AuthSuccessResponse>('/auth/login', request);

        if (response.success) {
            const tokens = response.data as AuthSuccessResponse;
            localStorage.setItem('accessToken', tokens.accessToken ?? '');
            localStorage.setItem('refreshToken', tokens.refreshToken ?? '');

            return undefined;
        }

        return response.error;
    },
    signInGoogle: async (token: string): Promise<any> => {
        const response = await API.post<{}, AuthSuccessResponse>('/google-auth/google-login', { }, { 'Authorization-Code': token });

        if (response.success) {
            const tokens = response.data as AuthSuccessResponse;
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);

            return undefined;
        }

        return extractServerErrorMessage(response.error) || "Google sign-in failed.";
    },
    signUp: async (request: SignUpRequest): Promise<any> => {
        const response = await API.post<SignUpRequest, AuthSuccessResponse>('/auth/register', request);

        if (response.success) {
            const tokens = response.data as AuthSuccessResponse;
            localStorage.setItem('accessToken', tokens.accessToken ?? '');
            localStorage.setItem('refreshToken', tokens.refreshToken ?? '');

            return undefined;
        }

        return response.error;
    },
    signUpGoogle: async (code: string, token: string): Promise<any> => {
        const response = await API.post<{}, AuthSuccessResponse>(`/google-auth/google-register?token=${token}`, { }, { 'Authorization-Code': code });

        if (response.success) {
            const tokens = response.data as AuthSuccessResponse;
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);

            return undefined;
        }

        return extractServerErrorMessage(response.error) || "Google sign-up failed.";
    },
    forgotPassword: async (email: string): Promise<any> => {
        const response = await API.post<{}, {}>('/auth/forgot-password', { email });
        if (response.success) {
            return undefined;
        }

        return response.error;
    },
    resetPassword: async (data: ResetPasswordRequest): Promise<any> => {
        const response = await API.post<{}, {}>('/auth/reset-password', data);

        if (response.success) {
            return undefined;
        }

        return response.error;
    },
    refreshToken: async (request: RefreshTokenRequest): Promise<any> => {
        const response = await API.post<RefreshTokenRequest, AuthSuccessResponse>(
            '/auth/refresh-token',
            request,
            undefined,
            { skipGlobalErrorToast: true }
        );

        if (response.statusCode === 400) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } 

        if (response.success) {
            const tokens = response.data as AuthSuccessResponse;
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);

            return undefined;
        }

        return response.error;
    }
}

export default Auth;