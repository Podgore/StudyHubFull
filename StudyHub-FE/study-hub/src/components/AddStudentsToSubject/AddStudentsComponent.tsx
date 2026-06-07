import { Button, Typography } from "@mui/material";
import AddStudentsModal from "../StudentsComponent/AddStudentsModal";
import StudentsComponent from "../StudentsComponent/StudentsComponent";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

type AddStudentsComponentProps = {
    wrapperClassName?: string;
    listClassName?: string;
};

const AddStudentsComponent = ({ wrapperClassName, listClassName }: AddStudentsComponentProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [studentsListKey, setStudentsListKey] = useState(0);

    return (
        <>
            <div className={wrapperClassName}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>Students</Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setModalOpen(true)}
                        sx={{ borderRadius: 999, textTransform: 'none' }}
                    >
                        Add student
                    </Button>
                    <AddStudentsModal
                        isModalOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onEnrollmentChanged={() => setStudentsListKey((k) => k + 1)}
                    />
                </div>
                <div className={listClassName}>
                    <StudentsComponent key={studentsListKey} />
                </div>
            </div>
        </>
    );
}

export default AddStudentsComponent;