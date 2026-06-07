import * as yup from "yup";
import { CreateAssignment } from "../components/AssignmentBuilder/NewAssignmentModal";
import { AssignmentKind } from "../api/models/response/AssignmentResponse";
import { parseDurationHhMmSsToMs } from "../utils/assignmentDateTimeForm";

export const createAssignmentValidationSchema = yup.object<CreateAssignment>().shape({
    title: yup.string().required("Title is required"),
    kind: yup.number().oneOf([0, 1]).required(),
    maxMark: yup
        .number()
        .typeError("Max mark must be a number")
        .when("kind", {
            is: 0,
            then: (schema) => schema.moreThan(0, "Max mark must be positive for tests"),
            otherwise: (schema) => schema.min(0, "Max mark cannot be negative").required(),
        }),
    openingDate: yup
        .string()
        .typeError("Opening date is required")
        .required("Opening date is required")
        .test("opening-future", "Assignment start must be now or in the future", (value) => {
            if (!value) return false;
            const t = new Date(value).getTime();
            return !Number.isNaN(t) && t >= Date.now() - 2000;
        }),
    closingDate: yup
        .string()
        .typeError("Closing date is required")
        .required("Closing date is required")
        .test("closing-after-open", "Assignment end must be after the start", function (value) {
            const { openingDate } = this.parent as CreateAssignment;
            if (!value || !openingDate) return false;
            const close = new Date(value).getTime();
            const open = new Date(openingDate).getTime();
            if (Number.isNaN(close) || Number.isNaN(open)) return false;
            return close > open;
        })
        .test(
            "closing-window-vs-duration",
            "The time from start to end must be at least the test duration",
            function (value) {
                const { openingDate, duration, kind } = this.parent as CreateAssignment;
                if (kind !== AssignmentKind.TimedTest || !value || !openingDate || !duration) return true;
                const durMs = parseDurationHhMmSsToMs(duration);
                if (durMs == null || durMs <= 0) return true;
                const close = new Date(value).getTime();
                const open = new Date(openingDate).getTime();
                if (Number.isNaN(close) || Number.isNaN(open)) return false;
                return close - open >= durMs;
            }
        ),
    duration: yup
        .string()
        .matches(/^([0-9]{2}):([0-9]{2}):([0-9]{2})$/, "Duration must be in hh:mm:ss format")
        .when("kind", {
            is: 0,
            then: (schema) =>
                schema.test("non-zero", "Tests need a non-zero duration", (v) => v !== "00:00:00"),
            otherwise: (schema) => schema,
        })
        .required("Duration is required"),
    instructions: yup.string().when("kind", {
        is: 1,
        then: (schema) => schema.max(20000).optional(),
        otherwise: (schema) => schema.strip().optional(),
    }),
    lectureId: yup.string().when("kind", {
        is: 1,
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.strip().optional(),
    }),
});
