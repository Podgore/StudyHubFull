import axios from "axios";
import { enqueueSnackbar } from "notistack";
import { APIRequestBase } from "../models/request/base/APIRequestBase";
import APIResponse from "../models/response/APIResponse";
import RefreshTokenRequest from "../models/request/Auth/RefreshTokenRequest";
import Auth from "../Auth";
import { API_ORIGIN } from "../../config/apiOrigin";
import { extractServerErrorMessage } from "../../utils/apiErrorMessage";

const API_URL =
  API_ORIGIN === "" ? "/api" : `${API_ORIGIN.replace(/\/$/, "")}/api`;

export { API_ORIGIN };

// Axios typings under `moduleResolution: "Node16"` resolve to a namespace without `.create()`; runtime is correct.
// @ts-expect-error axios default export interop
const axiosInstance = axios.create();

type AxiosLikeError = {
    response?: { status?: number; data?: unknown };
    config?: { skipGlobalErrorToast?: boolean };
};

function isAxiosLike(error: unknown): error is AxiosLikeError {
    return typeof error === "object" && error !== null && "config" in error;
}

function showGlobalServerErrorToast(error: AxiosLikeError) {
    const cfg = error.config;
    if (cfg?.skipGlobalErrorToast) return;
    const status = error.response?.status;
    if (status === 401) return;
    const msg = extractServerErrorMessage(error.response?.data);
    if (msg) {
        enqueueSnackbar(msg, { variant: "error" });
        return;
    }
    if (error.response) {
        enqueueSnackbar("Request failed. Please try again.", { variant: "error" });
    } else {
        enqueueSnackbar("Network error. Check your connection.", { variant: "error" });
    }
}

axiosInstance.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error: unknown) => {
    if (!isAxiosLike(error)) {
      return Promise.reject(error);
    }
    const axError = error;
    console.log(axError.response?.status);
    if (axError.response?.status === 401) {
      try {
        const request = {
          accessToken: localStorage.getItem('accessToken') ?? '',
          refreshToken: localStorage.getItem('refreshToken') ?? ''
        };

        const response = await Auth.refreshToken(request as RefreshTokenRequest);
        window.location.reload();
        
      } catch (refreshError) {
        console.log('Silent refresh failed');
      }
    } else {
      showGlobalServerErrorToast(axError);
    }
    return Promise.reject(error);
  }
);

export const API = {
    get: async <TResponse>(url: string, params?: any): Promise<APIResponse<TResponse>> => {
        try {
            const response = await axiosInstance.get<TResponse>(API_URL + url, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                },
                params
            });
            return { success: true, data: response.data, statusCode: response.status };
        } catch (error: any) {
            return { success: false, error: error.response?.data, statusCode: error.response?.status };
        }
    },

    post: async <TRequest extends APIRequestBase, TResponse>(
        url: string,
        data?: TRequest,
        headers?: { [key: string]: string },
        axiosOptions?: { skipGlobalErrorToast?: boolean }
    ): Promise<APIResponse<TResponse>> => {
        try {
            const response = await axiosInstance.post<TResponse>(API_URL + url, data, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
                    ...headers
                },
                ...axiosOptions,
            });
            return { success: true, data: response.data, statusCode: response.status };
        } catch (error: any) {
            return { success: false, error: error.response?.data, statusCode: error.response?.status };
        }
    },

    put: async <TRequest extends APIRequestBase, TResponse>(
        url: string,
        data: TRequest
    ): Promise<APIResponse<TResponse>> => {
        try {
            const response = await axiosInstance.put<TResponse>(API_URL + url, data, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            return { success: true, data: response.data, statusCode: response.status };
        } catch (error: any) {
            return { success: false, error: error.response?.data, statusCode: error.response?.status };
        }
    },

    delete: async <TResponse>(url: string): Promise<APIResponse<TResponse>> => {
        try {
            const response = await axiosInstance.delete<TResponse>(API_URL + url, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
                }
            });
            return { success: true, data: response.data, statusCode: response.status };
        } catch (error: any) {
            return { success: false, error: error.response?.data, statusCode: error.response?.status };
        }
    },

    postForm: async <TResponse>(url: string, formData: FormData): Promise<APIResponse<TResponse>> => {
        try {
            const response = await axiosInstance.post<TResponse>(API_URL + url, formData, {
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('accessToken'),
                },
            });
            return { success: true, data: response.data, statusCode: response.status };
        } catch (error: any) {
            return { success: false, error: error.response?.data, statusCode: error.response?.status };
        }
    },
};

export default API;