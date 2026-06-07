import { APIRequestBase } from "../base/APIRequestBase";

interface RefreshTokenRequest extends APIRequestBase {
    refreshToken: string;
    accessToken: string;
}

export default RefreshTokenRequest;