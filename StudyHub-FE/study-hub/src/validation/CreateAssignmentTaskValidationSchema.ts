import * as yup from 'yup';
import { CreateAssignmentTaskRequest } from "../api/models/request/Variant/CreateAssignmentTask";

export const createAssignmentTaskValidationSchema = yup.object<CreateAssignmentTaskRequest>().shape({
    maxMark: yup.number()
        .typeError('Max mark must be a number')
        .positive('Max mark must be positive')
        .required('Max mark is required'),
}) 