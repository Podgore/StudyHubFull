/// <reference types="react-scripts" />

declare module "axios" {
    export interface AxiosRequestConfig {
        skipGlobalErrorToast?: boolean;
    }
}
