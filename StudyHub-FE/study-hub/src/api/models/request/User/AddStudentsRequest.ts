import { APIRequestBase } from "../base/APIRequestBase";

interface AddStudentsRequest extends APIRequestBase{
    emails: string[];
}; 

export default AddStudentsRequest;