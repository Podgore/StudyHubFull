import { Avatar, IconButton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import UserResponse from "../../api/models/response/UserResponse";
import DeleteIcon from '@mui/icons-material/Delete';
import Subject from "../../api/Subject";
import profile from "../../img/Student.png";
import { useParams } from "react-router-dom";
import { API_ORIGIN } from "../../config/apiOrigin";

const studentAvatarSrc = (student: UserResponse): string => {
    const path = student.avatar?.trim();
    return path ? `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}` : profile;
};

const StudentsComponent = () => {
    const [students, setStudents] = useState<UserResponse[]>([]);
    const { id } = useParams();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await Subject.getSubjectStudents(id);
            setStudents(response!);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteStudent = async (studentEmail: string) => {
        try {
            await Subject.removeStudentFromSubject(studentEmail, id);
            setStudents((prev) => prev.filter((student) => student.email !== studentEmail));
            console.log(students);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {students.map((student) => (
                <div
                    key={student.id}
                    style={{
                        padding: 10,
                        border: "1px solid rgba(0,0,0,0.10)",
                        borderRadius: 12,
                        marginBottom: 10,
                        boxShadow: "0px 1px 1px rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        height: "70px",
                        backgroundColor: "#ffffff",
                    }}
                >
                    <Avatar
                        src={studentAvatarSrc(student)}
                        imgProps={{
                            onError: (e) => {
                                const el = e.currentTarget;
                                if (el.getAttribute("data-img-fallback") !== "1") {
                                    el.setAttribute("data-img-fallback", "1");
                                    el.src = profile;
                                }
                            },
                        }}
                        sx={{
                            width: 50,
                            height: 50,
                            marginLeft: "0.5rem",
                            marginRight: "0.5rem",
                        }}
                    >
                        {(student.fullName?.trim()?.charAt(0) ?? "?").toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "1rem", color: "black" }}>
                            {student.fullName}
                        </Typography>
                        <Typography sx={{ fontSize: "0.95rem", color: "gray" }}>
                            {student.email}
                        </Typography>
                    </div>
                    <IconButton
                        style={{ marginRight: "2%" }}
                        onClick={() => handleDeleteStudent(student.email)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </div>
            ))
            }
        </div >
    );
};

export default StudentsComponent;
