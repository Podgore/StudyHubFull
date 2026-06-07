import {
    Alert,
    Avatar,
    Box,
    CircularProgress,
    Snackbar,
    TextField,
} from "@mui/material";
import UserResponse from "../../api/models/response/UserResponse";
import styles from "./Profile.module.css";
import profile from "../../img/Profile.png";
import { API_ORIGIN } from "../../config/apiOrigin";
import { useEffect, useRef, useState } from "react";
import User from "../../api/User";
import UpdateUserInformation from "../../api/models/request/User/UpdateUserInformation";
import EditIcon from "@mui/icons-material/Edit";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

const mapUserResponseToUpdateRequest = (user: UserResponse): UpdateUserInformation => {
    return {
        fullname: user.fullName,
        telegram: user.telegram,
        group: user.group || "",
        course: user.course || "",
        faculty: user.faculty || "",
    };
};

function formatRole(role: string | undefined): string {
    if (!role?.trim()) return "—";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function ProfileField({
    label,
    value,
    viewMode,
    onChange,
}: {
    label: string;
    value: string;
    viewMode: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <div className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>{label}</span>
            <TextField
                fullWidth
                size="small"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={viewMode}
                variant="outlined"
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        backgroundColor: viewMode ? "#f4f4f6" : "#fafafa",
                        fontWeight: 500,
                        color: "#334155",
                        "& fieldset": {
                            borderColor: "rgba(15, 23, 42, 0.08)",
                        },
                        "&:hover fieldset": {
                            borderColor: viewMode ? "rgba(15, 23, 42, 0.08)" : "rgba(212, 26, 109, 0.35)",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#d41a6d",
                        },
                        "&.Mui-disabled": {
                            backgroundColor: "#f4f4f6",
                            color: "rgba(51, 65, 85, 0.85)",
                            "& fieldset": {
                                borderColor: "rgba(15, 23, 42, 0.06)",
                            },
                        },
                    },
                }}
            />
        </div>
    );
}

const Profile = (props: { user: UserResponse | undefined }) => {
    const [isViewMode, setViewMode] = useState(true);
    const [formData, setFormData] = useState<UserResponse | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState<"success" | "error">("success");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = (field: keyof UserResponse, value: string) => {
        setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    useEffect(() => {
        if (props.user) {
            setFormData(props.user);
        }
    }, [props.user]);

    const handleSaveClick = async () => {
        if (!formData) return;
        try {
            await User.updateUserInformation(mapUserResponseToUpdateRequest(formData));
            setAlertMessage("Profile updated successfully!");
            setAlertSeverity("success");
            setAlertOpen(true);
            setViewMode(true);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setAlertMessage("Failed to update profile.");
            setAlertSeverity("error");
            setAlertOpen(true);
        }
    };

    const handleEditToggle = () => {
        if (!isViewMode) {
            void handleSaveClick();
            return;
        }
        setViewMode(false);
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const photo = event.target.files[0];
        const fd = new FormData();
        fd.append("avatar", photo);

        try {
            await User.updateUserAvatar(fd);
            setAlertMessage("Profile photo updated successfully!");
            setAlertSeverity("success");
            setAlertOpen(true);

            setFormData((prev) => (prev ? { ...prev, avatar: URL.createObjectURL(photo) } : prev));
        } catch (error) {
            console.error("Failed to update profile photo:", error);
            setAlertMessage("Failed to update profile photo.");
            setAlertSeverity("error");
            setAlertOpen(true);
        }
    };

    if (!formData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={280}>
                <CircularProgress sx={{ color: "#d41a6d" }} />
            </Box>
        );
    }

    const path = (formData.avatar || props.user?.avatar || "").trim();
    const avatarSrc =
        path.startsWith("blob:") || path.startsWith("data:")
            ? path
            : path.startsWith("http")
              ? path
              : path !== ""
                ? `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
                : null;

    const isStudent = formData.role?.toLowerCase() === "student";

    return (
        <>
            <div className={styles.pageWrap}>
                <section className={styles.identityCard} aria-label="Profile header">
                    <div className={styles.identityBody}>
                        <div
                            className={styles.avatarWrap}
                            onClick={handlePhotoClick}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handlePhotoClick();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            {avatarSrc ? (
                                <Avatar
                                    src={avatarSrc}
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
                                        width: "100%",
                                        height: "100%",
                                        fontSize: "2rem",
                                    }}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <PersonOutlineIcon sx={{ fontSize: 42, color: "#fff" }} />
                                </div>
                            )}
                            <div className={styles.avatarHover} aria-hidden>
                                <EditIcon sx={{ color: "#fff", fontSize: 28 }} />
                            </div>
                        </div>

                        <div className={styles.identityText}>
                            <h1 className={styles.displayName}>{(formData.fullName || " ").trim() || "—"}</h1>
                            <p className={styles.roleLine}>
                                Role: <span className={styles.roleHighlight}>{formatRole(formData.role)}</span>
                            </p>
                        </div>

                        <button
                            type="button"
                            className={isViewMode ? styles.editOutlineBtn : styles.editSolidBtn}
                            onClick={handleEditToggle}
                        >
                            {isViewMode ? "EDIT" : "SAVE"}
                        </button>
                    </div>
                </section>

                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handlePhotoChange} />

                <section className={styles.detailsCard} aria-label="Personal information">
                    <h2 className={styles.sectionTitle}>Personal Information</h2>
                    <div className={styles.fieldsGrid}>
                        <ProfileField
                            label="Full name"
                            value={formData.fullName || ""}
                            viewMode={isViewMode}
                            onChange={(v) => handleFieldChange("fullName", v)}
                        />
                        <ProfileField
                            label="Email"
                            value={formData.email || ""}
                            viewMode={isViewMode}
                            onChange={(v) => handleFieldChange("email", v)}
                        />
                        {isStudent && (
                            <>
                                <ProfileField
                                    label="Faculty"
                                    value={formData.faculty || ""}
                                    viewMode={isViewMode}
                                    onChange={(v) => handleFieldChange("faculty", v)}
                                />
                                <ProfileField
                                    label="Group"
                                    value={formData.group || ""}
                                    viewMode={isViewMode}
                                    onChange={(v) => handleFieldChange("group", v)}
                                />
                                <ProfileField
                                    label="Course"
                                    value={formData.course || ""}
                                    viewMode={isViewMode}
                                    onChange={(v) => handleFieldChange("course", v)}
                                />
                                <ProfileField
                                    label="Telegram"
                                    value={formData.telegram || ""}
                                    viewMode={isViewMode}
                                    onChange={(v) => handleFieldChange("telegram", v)}
                                />
                            </>
                        )}
                        {!isStudent && (
                            <Box sx={{ gridColumn: "1 / -1" }}>
                                <ProfileField
                                    label="Telegram"
                                    value={formData.telegram || ""}
                                    viewMode={isViewMode}
                                    onChange={(v) => handleFieldChange("telegram", v)}
                                />
                            </Box>
                        )}
                    </div>
                </section>
            </div>

            <Snackbar
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Alert
                    severity={alertSeverity}
                    variant="filled"
                    sx={{ width: "100%" }}
                    onClose={() => setAlertOpen(false)}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Profile;
