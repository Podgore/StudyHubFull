import { APIRequestBase } from "../base/APIRequestBase";

interface UpdateUserInforamtion extends APIRequestBase {
    fullname: string;
    telegram: string;
    group: string;
    course: string;
    faculty: string;
}; 

export default UpdateUserInforamtion;