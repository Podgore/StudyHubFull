import { Box, Button, Card, Grid, InputBase, Paper, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SubjectResponse from "../../api/models/response/SubjectResponse";
import Subject from "../../api/Subject";
import styles from './ListSubjects.module.css';

const ListSubjects = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<SubjectResponse[] | undefined>(undefined);

    useEffect(() => {
        const getSubjects = async () => {
            try {
                const response = await Subject.getSubjectsForUser();
                setSubjects(Array.isArray(response) ? response : []);
            } catch {
                setSubjects([]);
            }
        };

        getSubjects();
    }, []);
    return (
        <Box className={styles.listBox}>
            <Box className={styles.searchBox}>
                <Paper
                    component="form"
                    className={styles.searchBar}
                    sx={{ backgroundColor: '#d9d9d9', borderRadius: '24px' }}>
                    <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Enter teacher" />
                </Paper>
                <Paper
                    component="form"
                    className={styles.searchBar}
                    sx={{ backgroundColor: '#d9d9d9', borderRadius: '24px' }}>
                    <InputBase sx={{ ml: 1, flex: 1 }} placeholder="Enter title" />
                </Paper>
                <Button color="primary" variant="contained" sx={{
                    width: '150px',
                    borderRadius: '24px',
                    textTransform: 'none',
                }}>
                    Search
                </Button>
            </Box>
            <Card className={styles.subjectsCard} sx={{ borderRadius: '24px' }}>
                {Array.isArray(subjects) && subjects.length > 0 ? (
                    <Grid
                        container
                        rowSpacing={2}
                        spacing={2}
                    >
                        {subjects.map((subject, index) => (
                            <Grid item xs={6} key={index}>
                                <Box className={styles.subjectBox} sx={{ borderRadius: '24px' }}>
                                    <Typography variant="h5" sx={{
                                        fontWeight: 'bold',
                                    }}>{subject.title}</Typography>
                                    <Typography>{subject.teacher.fullName}</Typography>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        className={styles.buttonBox}
                                        onClick={() => {navigate(`/subject/${subject.id}`)}}
                                        sx={{
                                            borderRadius: '24px',
                                            textTransform: 'none',
                                            mt: '40px',
                                        }}>
                                        View
                                    </Button>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                ) : <Typography variant="h5" sx={{
                    fontWeight: 'bold',
                }}>No subjects</Typography>}
            </Card>

        </Box>
    );
}

export default ListSubjects;