interface APIResponse<T> {
    success: boolean;
    data?: T;
    statusCode?: number;
    error?: any;
}

export default APIResponse;