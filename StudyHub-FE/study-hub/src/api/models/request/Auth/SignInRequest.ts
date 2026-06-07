import { APIRequestBase } from "../base/APIRequestBase";

interface SignInRequest extends APIRequestBase{
    email: string;
    password: string;
}

export default SignInRequest;