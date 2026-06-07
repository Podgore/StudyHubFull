import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Card, Chip, CircularProgress, LinearProgress, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import PageHeader from '../../components/PageHeader/PageHeader';
import ButtonsMenu from '../../components/ButtonsMenu/ButtonsMenu';
import User from '../../api/User';
import UserResponse from '../../api/models/response/UserResponse';
import StudentGrades from '../../api/StudentGrades';
import StudentGradesSummaryResponse from '../../api/models/response/StudentGradesSummaryResponse';
import StudentSubjectGradeRowResponse from '../../api/models/response/StudentSubjectGradeRowResponse';
import StudentAssignmentGradeRowResponse from '../../api/models/response/StudentAssignmentGradeRowResponse';
import { AssignmentKind } from '../../api/models/response/AssignmentResponse';
import shell from '../../layouts/AuthenticatedShell.module.css';
import styles from './MyGradesPage.module.css';

const SUBJECT_PROGRESS_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function letterGradeBadgeClass(letter: string | null | undefined): string {
  const first = letter?.trim().charAt(0).toUpperCase() ?? '';
  if (first === 'A') return styles.badgeA;
  if (first === 'B') return styles.badgeB;
  if (first === 'C') return styles.badgeC;
  if (first === 'D') return styles.badgeD;
  if (first === 'F') return styles.badgeF;
  return styles.badgeNeutral;
}

function scoreToneClass(pct: number | null | undefined): string {
  if (pct == null) return styles.scorePercentNeutral;
  if (pct >= 88) return styles.scorePercentHigh;
  if (pct >= 72) return styles.scorePercentMid;
  return styles.scorePercentLow;
}

function assignmentTypeChipClass(a: StudentAssignmentGradeRowResponse): string {
  const isTest = a.kind === AssignmentKind.TimedTest;
  if (isTest) return styles.typeChipTest;
  if (/quiz/i.test(a.typeLabel)) return styles.typeChipQuiz;
  return styles.typeChipHomework;
}

const MyGradesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | undefined>(undefined);
  const [summary, setSummary] = useState<StudentGradesSummaryResponse | undefined>(undefined);
  const [subjects, setSubjects] = useState<StudentSubjectGradeRowResponse[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignmentGradeRowResponse[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.subjectId === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId],
  );

  const loadAssignments = useCallback(async (subjectId: string) => {
    setLoadingAssignments(true);
    try {
      const rows = await StudentGrades.getAssignmentsForSubject(subjectId);
      setAssignments(Array.isArray(rows) ? rows : []);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingPage(true);
      setError(null);
      try {
        const me = await User.me();
        if (cancelled) return;
        setUser(me);
        if (me?.role?.toLowerCase() !== 'student') {
          navigate('/dashboard');
          return;
        }
        const [sum, subs] = await Promise.all([StudentGrades.getSummary(), StudentGrades.getSubjects()]);
        if (cancelled) return;
        if (sum === undefined || subs === undefined) {
          setError('Could not load grades. Please try again.');
          setSummary(undefined);
          setSubjects([]);
        } else {
          setSummary(sum);
          const list = Array.isArray(subs) ? subs : [];
          setSubjects(list);
          const firstId = list[0]?.subjectId ?? null;
          setSelectedSubjectId(firstId);
        }
      } catch {
        if (!cancelled) setError('Could not load grades. Please try again.');
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setAssignments([]);
      return;
    }
    void loadAssignments(selectedSubjectId);
  }, [selectedSubjectId, loadAssignments]);

  const completionLabel = summary
    ? `${summary.completedAssignments}/${summary.totalAssignments}`
    : '—/—';

  return (
    <div className={shell.pageShell}>
      <PageHeader user={user} />
      <div className={shell.pageBody}>
        <ButtonsMenu activeView="grades" user={user} />
        <div className={`${styles.content} ${shell.mainScroll}`}>
          <div className={styles.titleBlock}>
            <Typography component="h1" variant="h4" className={styles.pageTitle}>
              My Grades
            </Typography>
            <Typography component="p" variant="body1" className={styles.subtitle}>
              Track your academic performance and progress
            </Typography>
          </div>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loadingPage ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              <div className={styles.statGrid}>
                <Card className={`${styles.statCard} ${styles.statCardPurple}`} elevation={0}>
                  <div className={styles.statPurpleIcon}>
                    <EmojiEventsIcon sx={{ fontSize: 26, color: '#fff' }} />
                  </div>
                  <span className={styles.statPurpleValue}>
                    {summary?.overallAveragePercent != null ? `${summary.overallAveragePercent}%` : '—'}
                  </span>
                  <span className={styles.statPurpleCaption}>Overall Average</span>
                </Card>

                <Card className={`${styles.statCard} ${styles.statCardPlain}`} elevation={0}>
                  <div className={`${styles.statIconWrap} ${styles.statIconWrapBlue}`}>
                    <MenuBookIcon sx={{ fontSize: 24 }} />
                  </div>
                  <span className={styles.statPlainValue}>{summary?.activeSubjects ?? 0}</span>
                  <span className={styles.statPlainCaption}>Active Subjects</span>
                </Card>

                <Card className={`${styles.statCard} ${styles.statCardPlain}`} elevation={0}>
                  <div className={`${styles.statIconWrap} ${styles.statIconWrapGreen}`}>
                    <AssignmentTurnedInIcon sx={{ fontSize: 24 }} />
                  </div>
                  <span className={styles.statPlainValue}>{completionLabel}</span>
                  <span className={styles.statPlainCaption}>Assignments Completed</span>
                </Card>

                <Card className={`${styles.statCard} ${styles.statCardPlain}`} elevation={0}>
                  <div className={`${styles.statIconWrap} ${styles.statIconWrapPink}`}>
                    <TrendingUpIcon sx={{ fontSize: 24 }} />
                  </div>
                  <span className={styles.statPlainValue}>
                    {summary?.completionRatePercent != null ? `${summary.completionRatePercent}%` : '—'}
                  </span>
                  <span className={styles.statPlainCaption}>Completion Rate</span>
                </Card>
              </div>

              {subjects.length === 0 ? (
                <Typography color="text.secondary">You are not enrolled in any subjects yet.</Typography>
              ) : (
                <>
                  <h2 className={styles.sectionHeading}>Subjects Overview</h2>
                  <div className={styles.subjectGrid}>
                    {subjects.map((s, index) => {
                      const progress =
                        s.totalAssignments > 0 ? (100 * s.completedAssignments) / s.totalAssignments : 0;
                      const selected = s.subjectId === selectedSubjectId;
                      const barColor = SUBJECT_PROGRESS_COLORS[index % SUBJECT_PROGRESS_COLORS.length];
                      return (
                        <Card
                          key={s.subjectId}
                          className={`${styles.subjectCard} ${selected ? styles.subjectCardSelected : ''}`}
                          onClick={() => setSelectedSubjectId(s.subjectId)}
                          elevation={0}
                        >
                          <div className={styles.subjectCardTop}>
                            <span className={styles.subjectName}>{s.subjectName}</span>
                            <span
                              className={`${styles.subjectLetterBadge} ${letterGradeBadgeClass(s.letterGrade)}`}
                            >
                              {s.letterGrade ?? '—'}
                            </span>
                          </div>
                          <p className={styles.subjectAvgLine}>
                            {s.averagePercent != null ? (
                              <>
                                {s.averagePercent}%
                                <span>average</span>
                              </>
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>
                                No graded work yet
                              </span>
                            )}
                          </p>
                          <LinearProgress
                            className={styles.subjectProgress}
                            variant="determinate"
                            value={Math.min(100, progress)}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: '#e8ecf1',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 999,
                                backgroundColor: barColor,
                              },
                            }}
                          />
                          <div className={styles.subjectProgressCaption}>
                            <span>Progress</span>
                            <strong>
                              {s.completedAssignments}/{s.totalAssignments}
                            </strong>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {selectedSubject && (
                    <div className={styles.detailPanel}>
                      <div className={styles.detailHeader}>
                        <div>
                          <Typography component="h2" variant="h5" className={styles.detailTitle}>
                            {selectedSubject.subjectName}
                          </Typography>
                          <Typography component="p" className={styles.detailMeta}>
                            {selectedSubject.totalAssignments} assignments
                            {selectedSubject.averagePercent != null
                              ? ` • ${selectedSubject.averagePercent}% average`
                              : ''}
                          </Typography>
                        </div>
                        <div className={styles.currentGradeBlock}>
                          <div
                            className={`${styles.gradeCircle} ${letterGradeBadgeClass(selectedSubject.letterGrade)}`}
                          >
                            {selectedSubject.letterGrade ?? '—'}
                          </div>
                          <Typography variant="caption" className={styles.currentGradeLabel}>
                            Current Grade
                          </Typography>
                        </div>
                      </div>

                      {loadingAssignments ? (
                        <Box display="flex" justifyContent="center" py={4}>
                          <CircularProgress size={32} />
                        </Box>
                      ) : (
                        <div className={styles.assignmentsList}>
                          {assignments.map((a) => {
                            const feedback = a.teacherFeedback?.trim();
                            const chipTone = assignmentTypeChipClass(a);
                            return (
                              <Card key={a.assignmentId} className={styles.assignmentCard} elevation={0}>
                                <div className={styles.assignmentInner}>
                                  <div className={styles.assignmentMain}>
                                    <div className={styles.assignmentTitleRow}>
                                      <Typography component="h3" className={styles.assignmentTitle}>
                                        {a.title}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        label={a.typeLabel}
                                        variant="outlined"
                                        className={`${styles.typeChip} ${chipTone}`}
                                      />
                                    </div>
                                    <div className={styles.dateRow}>
                                      <span className={styles.dateItem}>
                                        <CalendarTodayIcon fontSize="small" />
                                        <span>Due: {formatDateTime(a.dueAt)}</span>
                                      </span>
                                      <span className={styles.dateItem}>
                                        <AccessTimeIcon fontSize="small" />
                                        <span>Submitted: {formatDateTime(a.submittedAt)}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <div className={styles.assignmentScoreCol}>
                                    {a.scorePercent != null ? (
                                      <span
                                        className={`${styles.scorePercent} ${scoreToneClass(a.scorePercent)}`}
                                      >
                                        {a.scorePercent}%
                                      </span>
                                    ) : (
                                      <span className={styles.scoreDash}>—</span>
                                    )}
                                    <span className={styles.scorePts}>
                                      {a.pointsEarned != null
                                        ? `${a.pointsEarned} / ${a.maxPoints} pts`
                                        : `— / ${a.maxPoints} pts`}
                                    </span>
                                  </div>
                                </div>
                                {feedback ? (
                                  <div className={styles.feedbackBox}>
                                    <FeedbackOutlinedIcon className={styles.feedbackIcon} fontSize="small" />
                                    <div className={styles.feedbackInner}>
                                      <p className={styles.feedbackHeading}>Teacher Feedback</p>
                                      <p className={styles.feedbackBody}>{feedback}</p>
                                    </div>
                                  </div>
                                ) : null}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGradesPage;
