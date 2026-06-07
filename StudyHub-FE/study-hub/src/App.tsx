import './App.css';
import { StyledEngineProvider, ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { STUDYHUB_PRIMARY_MAIN } from './theme/studyHubPalette';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import HomePage from './pages/HomePage';
import { SnackbarProvider } from 'notistack';
import ForgotPasswordPage from './pages/DashboardPage/ForgotPasswordPage/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ListSubjectsPage from './pages/ListSubjectsPage/ListSubjectsPage';
import SubjectPage from './pages/SubjectPage/SubjectPage';
import LectureDetailPage from './pages/LectureDetailPage/LectureDetailPage';
import AuthPage from './pages/AuthPage/AuthPage';
import AssignmentTaskPage from './pages/AssignmentTaskPage/AssignmentTaskPage';
import AssignmentBuilderPage from './pages/AssignmentBuilderPage/AssignmentBuilderPage';
import CourseTaskPage from './pages/CourseTaskPage/CourseTaskPage';
import GradeHomeworkPage from './pages/GradeHomeworkPage/GradeHomeworkPage';
import GradeOpenEndedPage from './pages/GradeOpenEndedPage/GradeOpenEndedPage';
import InvitePage from './pages/InvitePage/InvitePage';
import MyGradesPage from './pages/MyGradesPage/MyGradesPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage/TeacherStudentsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage/NotificationSettingsPage';

const theme = createTheme({
  palette: {
    primary: {
      main: STUDYHUB_PRIMARY_MAIN,
    },
    background: {
      default: '#ffffff',
    },
  },
  typography: { 'fontFamily': '"Source Sans 3", sans-serif' },
});

const routerBasename = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '') || undefined;

const router = createBrowserRouter([
  { path: '/reset-password/:email/:token', element: <ForgotPasswordPage /> },
  { path: '/sign-up/:token', element: <AuthPage toRenderFullname={true} /> },
  { path: '/sign-in', element: <AuthPage toRenderFullname={false} /> },
  { path: '/', element: <HomePage /> },
  { path: '/subjects', element: <ListSubjectsPage /> },
  { path: '/subject/:subjectId/lecture/:lectureId', element: <LectureDetailPage /> },
  { path: '/subject/:id', element: <SubjectPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/my-grades', element: <MyGradesPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/subject/:subjectId/assignment-creator/:assignmentId', element: <AssignmentBuilderPage /> },
  { path: '/subject/:subjectId/course-task/:assignmentId', element: <CourseTaskPage /> },
  { path: '/subject/:subjectId/homework-grade/:assignmentId', element: <GradeHomeworkPage /> },
  { path: '/subject/:subjectId/open-ended-grade/:assignmentId', element: <GradeOpenEndedPage /> },
  { path: '/subject/:subjectId/assignment/:assignmentId', element: <AssignmentTaskPage /> },
  { path: '/students', element: <TeacherStudentsPage /> },
  { path: '/settings', element: <NotificationSettingsPage /> },
  { path: '/invite-people', element: <InvitePage /> },
  { path: '*', element: <NotFoundPage /> },
], routerBasename ? { basename: routerBasename } : undefined);

function App() {
  return (
    <SnackbarProvider maxSnack={3}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <GoogleOAuthProvider
            clientId="738777886358-745pr29p66qlearc5r7mc7lve57lebcn.apps.googleusercontent.com"
          >
            <CssBaseline />
            <RouterProvider router={router} />
          </GoogleOAuthProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </SnackbarProvider>
  );
}

export default App;
