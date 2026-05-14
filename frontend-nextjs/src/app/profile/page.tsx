"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import styles from "./page.module.css";

type EnrolledCourse = {
  id: number;
  title: string;
  author: string;
  thumbnailUrl: string;
  category: string;
  enrolledAt: string;
};

type ProfileData = {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  totalCourses: number;
  enrolledCourses: EnrolledCourse[];
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"courses" | "settings">("courses");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
      return;
    }
    if (session) fetchProfile();
  }, [session, status]);

  const fetchProfile = async () => {
    try {
      // @ts-ignore
      const token = session!.backendToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditName(data.username);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // @ts-ignore
      const token = session!.backendToken;
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: editName }),
      });
      if (profile) setProfile({ ...profile, username: editName });
      alert("Profile updated!");
    } catch {
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // @ts-ignore
      const token = session!.backendToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/profile/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Account deleted successfully.");
        await signOut({ callbackUrl: "/" });
      } else {
        alert("Failed to delete account.");
      }
    } catch {
      alert("An error occurred while deleting account.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!profile) return null;

  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Profile Hero Banner */}
        <div className={styles.heroBanner}>
          <div className={styles.heroInner}>
            <div className={styles.avatarWrapper}>
              <img
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=6366f1&color=fff&size=128`}
                alt={profile.username}
                className={styles.avatar}
              />
              {profile.role === "Admin" && (
                <span className={styles.adminBadge}>Admin</span>
              )}
              {profile.role === "Instructor" && (
                <span className={styles.instructorBadge}>Instructor</span>
              )}
            </div>
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>{profile.username}</h1>
              <p className={styles.heroEmail}>{profile.email}</p>
              <p className={styles.heroJoined}>Member since {joinDate}</p>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{profile.totalCourses}</span>
                <span className={styles.statLabel}>Courses</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{profile.role}</span>
                <span className={styles.statLabel}>Role</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === "courses" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            My Courses
          </button>
          <button
            className={`${styles.tab} ${activeTab === "settings" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        <div className={styles.content}>
          {/* MY COURSES TAB */}
          {activeTab === "courses" && (
            <div>
              {profile.enrolledCourses.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎨</div>
                  <h2>No courses yet</h2>
                  <p>Start learning by browsing our courses.</p>
                  <Link href="/" className={styles.browseBtn}>Browse Courses</Link>
                </div>
              ) : (
                <div className={styles.courseGrid}>
                  {profile.enrolledCourses.map((course) => (
                    <Link href={`/course/${course.id}`} key={course.id} className={styles.courseCard}>
                      <img src={course.thumbnailUrl} alt={course.title} className={styles.courseThumbnail} />
                      <div className={styles.courseInfo}>
                        <span className={styles.courseCat}>{course.category}</span>
                        <h3 className={styles.courseTitle}>{course.title}</h3>
                        <p className={styles.courseAuthor}>{course.author}</p>
                        <p className={styles.enrolledAt}>
                          Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                        </p>
                        <div className={styles.continueBtn}>Continue Learning →</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className={styles.settingsPanel}>
              <h2 className={styles.settingsTitle}>Account Settings</h2>
              <div className={styles.settingsCard}>
                <div className={styles.field}>
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <input type="text" value={profile.email} disabled className={`${styles.input} ${styles.disabled}`} />
                  <span className={styles.hint}>Email cannot be changed.</span>
                </div>
                <div className={styles.field}>
                  <label>Role</label>
                  <input type="text" value={profile.role} disabled className={`${styles.input} ${styles.disabled}`} />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={styles.saveBtn}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* DANGER ZONE */}
              <div className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>Danger Zone</h3>
                <p className={styles.dangerDesc}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className={styles.deleteBtn}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Account</h3>
            <p className={styles.modalText}>
              This action cannot be undone. All your purchased courses, progress, and account data will be permanently deleted.
              <br /><br />
              Please type <span className={styles.modalHighlight}>{profile.email}</span> to confirm.
            </p>
            <input
              type="text"
              className={styles.modalInput}
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={profile.email}
            />
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInput("");
                }}
                className={styles.cancelBtn}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={styles.confirmDeleteBtn}
                disabled={deleteInput !== profile.email || deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
