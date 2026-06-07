import { APIRequestBase } from "../base/APIRequestBase";

interface SignUpRequest extends APIRequestBase{
    fullName: string;
    email: string;
    password: string;
    token: string;
}

export default SignUpRequest;