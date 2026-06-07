import { APIRequestBase } from "../base/APIRequestBase";

interface InviteUserRequest extends APIRequestBase {
    emails: string[];
    role: string;
}; 

export default InviteUserRequest;