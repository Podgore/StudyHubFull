import InviteUserRequest from "./models/request/User/InviteUserRequest";
import UpdateUserInforamtion from "./models/request/User/UpdateUserInformation";
import ResultResponse from "./models/response/ResultResponse";
import UserResponse from "./models/response/UserResponse";
import type {
    NotificationSettingsResponse,
    TelegramLinkResponse,
    UpdateNotificationSettingsRequest,
} from "./models/response/NotificationSettingsResponse";
import API from "./repository/Api";

let meInflight: Promise<UserResponse | undefined> | null = null;

const User = {
    me: async (): Promise<UserResponse | undefined> => {
        if (meInflight) return meInflight;
        const p = (async (): Promise<UserResponse | undefined> => {
            const response = await API.get<UserResponse>("/users/me");
            if (response.success) return response.data;
            return response.error;
        })();
        meInflight = p;
        try {
            return await p;
        } finally {
            meInflight = null;
        }
    },
    inviteUser: async (request: InviteUserRequest): Promise<ResultResponse | undefined> => {
        const response = await API.post<InviteUserRequest, ResultResponse>('/users/invite', { emails: request.emails, role: request.role });
        if (response.success) {
            return response.data;   
        }
    },
    updateUserInformation: async (request: UpdateUserInforamtion): Promise<ResultResponse | undefined> => {
        const response = await API.put<UpdateUserInforamtion, ResultResponse>('/users/me', request);
        if (response.success) {
            return response.data;   
        }
    },

    updateUserAvatar: async (request: FormData): Promise<ResultResponse | undefined> => {
        const response = await API.post<FormData, ResultResponse>('/users/me/avatar', request);
        if (response.success) {
            return response.data;   
        }
    },

    getNotificationSettings: async (): Promise<NotificationSettingsResponse> => {
        const response = await API.get<NotificationSettingsResponse>("/notification-settings");
        if (response.success && response.data) return response.data;
        throw new Error("notification-settings");
    },

    updateNotificationSettings: async (
        body: UpdateNotificationSettingsRequest,
    ): Promise<NotificationSettingsResponse> => {
        const response = await API.put<UpdateNotificationSettingsRequest, NotificationSettingsResponse>(
            "/notification-settings",
            body,
        );
        if (response.success && response.data) return response.data;
        throw new Error("notification-settings put");
    },

    createTelegramLink: async (): Promise<TelegramLinkResponse> => {
        const response = await API.post<Record<string, never>, TelegramLinkResponse>(
            "/notification-settings/telegram/link",
            {},
        );
        if (response.success && response.data) return response.data;
        throw new Error("telegram link");
    },

    disconnectTelegram: async (): Promise<void> => {
        const response = await API.delete<ResultResponse>("/notification-settings/telegram");
        if (response.success) return;
        throw new Error("telegram disconnect");
    },

    testTelegramNotification: async (): Promise<void> => {
        const response = await API.post<Record<string, never>, void>("/notification-settings/telegram/test", {});
        if (response.success) return;
        throw new Error("telegram test");
    },
}

export default User;