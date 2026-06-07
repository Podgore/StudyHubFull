import { Box, IconButton, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ButtonsMenu from "../../components/ButtonsMenu/ButtonsMenu";
import { useCallback, useEffect, useState } from "react";
import User from "../../api/User";
import UserResponse from "../../api/models/response/UserResponse";
import styles from './SubjectPage.module.css';
import profile from '../../img/Profile.png';
import Subject from "../../api/Subject";
import AssignmentResponse from "../../api/models/response/AssignmentResponse";
import SubjectResponse from "../../api/models/response/SubjectResponse";
import PageHeader from "../../components/PageHeader/PageHeader";
import shell from "../../layouts/AuthenticatedShell.module.css";
import AssignmentsCard from "../../components/AssignmentCard/AssignmentCard";
import AddStudentsComponent from "../../components/AddStudentsToSubject/AddStudentsComponent";
import LecturesCard from "../../components/LecturesCard/LecturesCard";
import type { LectureResponse } from "../../api/models/response/LectureResponse";
import Lecture from "../../api/Lecture";
import StudentGrades from "../../api/StudentGrades";
import type StudentAssignmentGradeRowResponse from "../../api/models/response/StudentAssignmentGradeRowResponse";
import EditSubjectTitleModal from "./components/EditSubjectTitleModal";
import useNotification from "../../hooks/useNotification";

const SubjectPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [user, setUser] = useState<UserResponse | undefined>(undefined);
  const [assignments, setAssignments] = useState<AssignmentResponse[] | undefined>([]);
  const [lectures, setLectures] = useState<LectureResponse[] | undefined>([]);
  const [subject, setSubject] = useState<SubjectResponse | undefined>();
  const [studentAssignmentGrades, setStudentAssignmentGrades] = useState<
    StudentAssignmentGradeRowResponse[] | undefined
  >(undefined);
  const navigate = useNavigate();
  const { notifyError, notifySuccess } = useNotification();
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [titleSaving, setTitleSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await User.me();
        setUser(response);
      } catch (error) {
        console.error(error);
        setUser(undefined);
      }
    };

    fetchUser();
    console.log(user);
  }, []);

  const refreshAssignments = useCallback(async () => {
    try {
      const response = await Subject.getSubjectWithAssignment(id);
      setAssignments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
      setAssignments([]);
    }
  }, [id]);

  const refreshLectures = useCallback(async () => {
    try {
      const response = await Lecture.getLecturesBySubject(id);
      setLectures(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
      setLectures([]);
    }
  }, [id]);

  useEffect(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  useEffect(() => {
    refreshLectures();
  }, [refreshLectures]);

  useEffect(() => {
    const loadGrades = async () => {
      if (user?.role?.toLowerCase() !== "student" || !id) {
        setStudentAssignmentGrades(undefined);
        return;
      }
      const rows = await StudentGrades.getAssignmentsForSubject(id);
      setStudentAssignmentGrades(Array.isArray(rows) ? rows : []);
    };
    void loadGrades();
  }, [user?.role, id, location.key]);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const response = await Subject.getSubject(id);
        setSubject(response);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSubject();
  }, [id])

  const role = user?.role?.toLowerCase();
  const canEditTitle = Boolean(user?.id && subject?.teacher?.id && user.id === subject.teacher.id);

  const handleSaveTitle = async (newTitle: string) => {
    if (!id || !newTitle) return;
    setTitleSaving(true);
    try {
      const updated = await Subject.updateSubject(id, { title: newTitle });
      if (updated) {
        setSubject(updated);
        setEditTitleOpen(false);
        notifySuccess("Subject title updated.");
      } else {
        notifyError("Could not update subject title.");
      }
    } finally {
      setTitleSaving(false);
    }
  };

  return (
    <div className={shell.pageShell}>
      <PageHeader user={user} />
      <div className={shell.pageBody}>
        <ButtonsMenu activeView="subjects" user={user} />
        <div className={`${styles.contentBox} ${shell.mainScroll}`}>
          <div className={styles.leftColumn}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ padding: "12px", minWidth: 0 }}
            >
              <Typography variant="h4" sx={{ fontWeight: "bold", flex: 1, minWidth: 0 }}>
                {subject?.title ?? ""}
              </Typography>
              {canEditTitle && (
                <IconButton
                  aria-label="Edit subject title"
                  size="small"
                  onClick={() => setEditTitleOpen(true)}
                  sx={{ flexShrink: 0 }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            <EditSubjectTitleModal
              open={editTitleOpen}
              title={subject?.title ?? ""}
              onClose={() => setEditTitleOpen(false)}
              onSave={handleSaveTitle}
              saving={titleSaving}
            />
            <LecturesCard
              lectures={lectures}
              user={user}
              subjectId={subject?.id}
              onLecturesUpdated={refreshLectures}
            />
            <AssignmentsCard
              assignments={assignments}
              user={user}
              subjectId={subject?.id}
              onNavigate={navigate}
              onAssignmentsUpdated={refreshAssignments}
              studentAssignmentGrades={studentAssignmentGrades}
            />
          </div>
          <div className={styles.rightColumn}>
            <div className={styles.teacherBox}>
              <Box component='img' sx={{ width: '90px', height: '90px' }} src={profile} />
              <div style={{ marginLeft: '20px' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{subject?.teacher.fullName}</Typography>
                <Typography variant="h6" sx={{ fontSize: "0.95rem", color: "gray" }}>{subject?.teacher.email}</Typography>
              </div>
            </div>
            {(role === 'teacher') && <AddStudentsComponent wrapperClassName={styles.studentsCard} listClassName={styles.studentsList} />}
            {user?.role.toLowerCase() === 'student'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectPage;