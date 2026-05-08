"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, DollarSign, Users, Plus, Star, CheckCircle2, Loader2, Pencil, Trash2, Menu } from "lucide-react";
import styles from "../admin/page.module.css"; // Reuse admin styles

type TutorStats = {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
};

type Course = {
  id: number;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isClasscutEnabled: boolean;
  createdAt: string;
  chapterCount: number;
  discountPct: number;
};

export default function TutorDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({ headline: "", bio: "", youtubeUrl: "", twitterUrl: "", portfolioImagesJson: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New course form
  const [newCourse, setNewCourse] = useState({
    title: "", category: "Illustration", price: "", originalPrice: "", thumbnailUrl: "", description: "", isClasscutEnabled: false,
    level: "Basic~Advanced", audioLanguage: "English", subtitleLanguage: "English, Vietnamese", includesMaterials: true
  });

  // Edit course modal
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "Illustration", price: "", originalPrice: "", thumbnailUrl: "", isClasscutEnabled: false });
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);

  // Video upload & curriculum state
  type LessonWithStatus = { id: number; title: string; isFreePreview: boolean; durationSeconds: number; vdoCipherVideoId?: string; };
  type ChapterWithLessons = { id: number; title: string; price: number; orderIndex: number; lessons: LessonWithStatus[]; };
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
  const [editingChapterPrice, setEditingChapterPrice] = useState<{id: number, price: number} | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState<{id: number, title: string} | null>(null);
  const [editingLesson, setEditingLesson] = useState<{id: number, title: string} | null>(null);
  const [uploadingLessonId, setUploadingLessonId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, string>>({}); // lessonId -> status msg
  const [uploadPercent, setUploadPercent] = useState<Record<number, number>>({}); // lessonId -> 0-100
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadLesson, setActiveUploadLesson] = useState<LessonWithStatus | null>(null);
  // Add Chapter modal
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  // Add Lesson
  const [addingLessonChapterId, setAddingLessonChapterId] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  // Portfolio drag & drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [portfolioUrlInput, setPortfolioUrlInput] = useState("");


  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
      return;
    }
    // Check if user is Instructor or Admin
    if (session?.user && (session as any).role !== "Instructor" && (session as any).role !== "Admin") {
       window.location.href = "/";
       return;
    }
    
    if (session) {
      fetchData();
    }
  }, [session, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = (session as any).backendToken;
      
      const statsRes = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      const coursesRes = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (coursesRes.ok) setCourses(await coursesRes.json());
      
      const profileRes = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile({ headline: p.headline || "", bio: p.bio || "", youtubeUrl: p.youtubeUrl || "", twitterUrl: p.twitterUrl || "", portfolioImagesJson: p.portfolioImagesJson || "" });
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (session as any).backendToken;
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/courses`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: newCourse.title,
          category: newCourse.category,
          price: parseFloat(newCourse.price),
          originalPrice: parseFloat(newCourse.originalPrice),
          thumbnailUrl: newCourse.thumbnailUrl,
          description: newCourse.description,
          isClasscutEnabled: newCourse.isClasscutEnabled,
          level: newCourse.level,
          audioLanguage: newCourse.audioLanguage,
          subtitleLanguage: newCourse.subtitleLanguage,
          includesMaterials: newCourse.includesMaterials
        })
      });

      if (res.ok) {
        alert("Course created successfully!");
        setShowAddModal(false);
        setNewCourse({ title: "", category: "Illustration", price: "", originalPrice: "", thumbnailUrl: "", description: "", isClasscutEnabled: false, level: "Basic~Advanced", audioLanguage: "English", subtitleLanguage: "English, Vietnamese", includesMaterials: true });
        fetchData();
      }
    } catch (err) {
      alert("Error creating course");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const token = (session as any).backendToken;
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      alert("Error updating profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course? All data will be lost.")) return;
    try {
      const token = (session as any).backendToken;
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/courses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Course deleted");
        fetchData();
      }
    } catch (err) {
      alert("Error deleting course");
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      category: course.category,
      price: String(course.price),
      originalPrice: String(course.originalPrice ?? ""),
      thumbnailUrl: course.thumbnailUrl ?? "",
      isClasscutEnabled: course.isClasscutEnabled,
    });
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      const token = (session as any).backendToken;
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editForm.title,
          category: editForm.category,
          price: parseFloat(editForm.price) || 0,
          originalPrice: parseFloat(editForm.originalPrice) || 0,
          thumbnailUrl: editForm.thumbnailUrl || undefined,
          isClasscutEnabled: editForm.isClasscutEnabled,
        }),
      });
      if (res.ok) {
        setEditingCourse(null);
        fetchData();
      } else {
        alert("Failed to save changes.");
      }
    } catch {
      alert("Error saving course.");
    }
  };

  const fetchCourseChapters = async (courseId: number) => {
    const token = (session as any)?.backendToken;
    const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/courses/${courseId}/curriculum`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      setChapters(data || []);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newChapterTitle.trim()) return;
    const token = (session as any)?.backendToken;
    const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/courses/${selectedCourseId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newChapterTitle, price: 0, sortOrder: chapters.length })
    });
    if (res.ok) {
      setShowAddChapterModal(false);
      setNewChapterTitle("");
      fetchCourseChapters(selectedCourseId);
    } else {
      alert("Failed to add chapter");
    }
  };

  const handleUpdateChapterPrice = async (chapterId: number, newPrice: number) => {
    const token = (session as any)?.backendToken;
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/chapters/${chapterId}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: newPrice })
      });
      if (res.ok) {
        setEditingChapterPrice(null);
        if (selectedCourseId) fetchCourseChapters(selectedCourseId);
      } else {
        alert("Failed to update chapter price");
      }
    } catch {
      alert("Error updating chapter price");
    }
  };

  const handleAddLesson = async (chapterId: number) => {
    if (!newLessonTitle.trim()) return;
    const token = (session as any)?.backendToken;
    const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/chapters/${chapterId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newLessonTitle, isFreePreview: false, orderIndex: 0, durationSeconds: 0 })
    });
    if (res.ok) {
      setAddingLessonChapterId(null);
      setNewLessonTitle("");
      if (selectedCourseId) fetchCourseChapters(selectedCourseId);
    } else {
      alert("Failed to add lesson");
    }
  };

  const handleUpdateChapterTitle = async (chapterId: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    const token = (session as any)?.backendToken;
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/chapters/${chapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, price: 0, sortOrder: 0 })
      });
      if (res.ok) {
        setEditingChapterTitle(null);
        if (selectedCourseId) fetchCourseChapters(selectedCourseId);
      }
    } catch {}
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm("Are you sure you want to delete this chapter and all its lessons?")) return;
    const token = (session as any)?.backendToken;
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/chapters/${chapterId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && selectedCourseId) fetchCourseChapters(selectedCourseId);
    } catch {}
  };

  const handleUpdateLessonTitle = async (lesson: any, newTitle: string) => {
    if (!newTitle.trim()) return;
    const token = (session as any)?.backendToken;
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, isFreePreview: lesson.isFreePreview, orderIndex: lesson.orderIndex || 0, durationSeconds: lesson.durationSeconds || 0 })
      });
      if (res.ok) {
        setEditingLesson(null);
        if (selectedCourseId) fetchCourseChapters(selectedCourseId);
      }
    } catch {}
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    const token = (session as any)?.backendToken;
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/lessons/${lessonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && selectedCourseId) fetchCourseChapters(selectedCourseId);
    } catch {}
  };

  const handleVideoUpload = async (lessonId: number, file: File) => {
    const token = (session as any)?.backendToken;
    if (!token) { alert("Not authenticated"); return; }

    setUploadingLessonId(lessonId);
    setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
    setUploadProgress(p => ({ ...p, [lessonId]: "Getting upload credentials..." }));

    try {
      // ── Bước 1: Lấy S3 credentials từ backend ─────────────────────────────
      let credRes: Response;
      try {
        credRes = await fetch(
          `\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/lessons/${lessonId}/upload-credentials`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        setUploadProgress(p => ({ ...p, [lessonId]: "❌ Cannot connect to server" }));
        setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
        setUploadingLessonId(null);
        setActiveUploadLesson(null);
        return;
      }

      if (!credRes.ok) {
        let errMsg = `Server error ${credRes.status}`;
        try { const e = await credRes.json(); errMsg = e.details || e.error || errMsg; } catch {}
        setUploadProgress(p => ({ ...p, [lessonId]: `❌ ${errMsg}` }));
        setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
        setUploadingLessonId(null);
        setActiveUploadLesson(null);
        return;
      }
      const creds = await credRes.json();
      setUploadProgress(p => ({ ...p, [lessonId]: "Uploading to VdoCipher..." }));

      // ── Bước 2: Browser upload thẳng lên S3 của VdoCipher ─────────────────
      await new Promise<void>((resolve) => {
        const formData = new FormData();
        // Thứ tự fields PHẢI theo đúng S3 policy (text fields trước, file cuối)
        formData.append("policy",            creds.policy);
        formData.append("key",               creds.key);
        formData.append("x-amz-signature",   creds.xAmzSignature);
        formData.append("x-amz-algorithm",   creds.xAmzAlgorithm);
        formData.append("x-amz-date",        creds.xAmzDate);
        formData.append("x-amz-credential",  creds.xAmzCredential);
        formData.append("success_action_status",   "201");
        formData.append("success_action_redirect", "");
        formData.append("file", file); // file phải là field cuối cùng

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadPercent(p => ({ ...p, [lessonId]: pct }));
            setUploadProgress(p => ({ ...p, [lessonId]: pct < 100 ? `Uploading... ${pct}%` : "Processing on VdoCipher..." }));
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status === 201) {
            setUploadProgress(p => ({ ...p, [lessonId]: "Saving..." }));
            // ── Bước 3: Báo backend lưu videoId vào DB ──────────────────────
            try {
              const attachRes = await fetch(
                `\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/lessons/${lessonId}/attach-video`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ videoId: creds.videoId }),
                }
              );
              if (attachRes.ok) {
                const attachData = await attachRes.json();
                if (attachData.durationSet) {
                  // Duration đã có ngay (ít khi xảy ra)
                  setUploadProgress(p => ({ ...p, [lessonId]: `✅ Done! ${Math.floor((attachData.durationSeconds ?? 0) / 60)}m` }));
                } else {
                  setUploadProgress(p => ({ ...p, [lessonId]: "✅ Uploaded! ⚙️ Encoding..." }));
                  // Poll sync-duration cho đến khi VdoCipher encode xong
                  let attempts = 0;
                  const pollDuration = async () => {
                    attempts++;
                    try {
                      const syncRes = await fetch(
                        `\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/lessons/${lessonId}/sync-duration`,
                        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
                      );
                      if (syncRes.ok) {
                        const syncData = await syncRes.json();
                        if (syncData.synced) {
                          setUploadProgress(p => ({ ...p, [lessonId]: `✅ Done! ${Math.floor(syncData.durationSeconds / 60)}m` }));
                          if (selectedCourseId) fetchCourseChapters(selectedCourseId);
                          return;
                        }
                      }
                    } catch {}
                    if (attempts < 10) setTimeout(pollDuration, 30000);
                    else {
                      setUploadProgress(p => ({ ...p, [lessonId]: "✅ Done! (sync duration manually)" }));
                      if (selectedCourseId) fetchCourseChapters(selectedCourseId);
                    }
                  };
                  setTimeout(pollDuration, 30000);
                }
                setUploadPercent(p => ({ ...p, [lessonId]: 100 }));
              } else {
                setUploadProgress(p => ({ ...p, [lessonId]: "❌ Upload done but failed to save video ID" }));
              }
            } catch {
              setUploadProgress(p => ({ ...p, [lessonId]: "❌ Upload done but failed to save video ID" }));
            }
          } else {
            setUploadProgress(p => ({ ...p, [lessonId]: `❌ S3 Error ${xhr.status}: ${xhr.responseText.slice(0, 120)}` }));
            setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
          }
          setUploadingLessonId(null);
          setActiveUploadLesson(null);
          resolve();
        });

        xhr.addEventListener("error", () => {
          setUploadProgress(p => ({ ...p, [lessonId]: "❌ Network error — check CORS or internet" }));
          setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
          setUploadingLessonId(null);
          setActiveUploadLesson(null);
          resolve();
        });

        xhr.open("POST", creds.uploadLink);
        xhr.send(formData);
      });

    } catch (err: any) {
      console.error("[VideoUpload] Unexpected error:", err);
      setUploadProgress(p => ({ ...p, [lessonId]: `❌ ${err?.message || "Unexpected error"}` }));
      setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
      setUploadingLessonId(null);
      setActiveUploadLesson(null);
    }
  };


  const handleVideoDelete = async (lessonId: number, lessonTitle: string) => {
    if (!confirm(`Delete video for "${lessonTitle}"? This cannot be undone.`)) return;
    const token = (session as any)?.backendToken;
    if (!token) return;
    try {
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/tutor/lessons/${lessonId}/video`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUploadProgress(p => ({ ...p, [lessonId]: "🗑️ Video deleted" }));
        if (selectedCourseId) fetchCourseChapters(selectedCourseId);
      } else {
        alert("Failed to delete video");
      }
    } catch {
      alert("Network error");
    }
  };

  if (status === "loading" || loading) return <div className={styles.loading}>Loading Tutor Studio...</div>;

  return (
    <div className={styles.adminLayout}>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoArea}>
          <Link href="/">
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>ArtLab <span style={{color: '#f59e0b'}}>Tutor</span></span>
          </Link>
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} /> Studio
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'courses' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("courses")}
          >
            <BookOpen size={20} /> My Courses
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("profile")}
          >
            <Users size={20} /> Instructor Profile
          </button>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 style={{ margin: 0 }}>{activeTab === 'dashboard' ? 'Studio Overview' : activeTab === 'courses' ? 'My Courses' : 'Instructor Profile'}</h2>
          </div>
          <div className={styles.userProfile}>
             <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{session?.user?.name}</span>
            <img src={session?.user?.image || "https://ui-avatars.com/api/?name=" + session?.user?.name} alt="" className={styles.avatar} />
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'dashboard' && stats && (
            <div className={styles.dashboardGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}><DollarSign size={24} /></div>
                <div>
                  <p className={styles.statLabel}>Total Earnings</p>
                  <h3 className={styles.statValue}>${stats.totalRevenue.toFixed(2)}</h3>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#e0e7ff', color: '#4f46e5' }}><Users size={24} /></div>
                <div>
                  <p className={styles.statLabel}>Enrolled Students</p>
                  <h3 className={styles.statValue}>{stats.totalStudents}</h3>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#16a34a' }}><BookOpen size={24} /></div>
                <div>
                  <p className={styles.statLabel}>Published Courses</p>
                  <h3 className={styles.statValue}>{stats.totalCourses}</h3>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className={styles.coursesSection}>
              <div className={styles.toolbar}>
                <input type="text" placeholder="Search my courses..." className={styles.searchInput} />
                <button className={styles.addBtn} onClick={() => setShowAddModal(true)} style={{ background: '#f59e0b', color: '#000' }}>
                  <Plus size={16} /> Create Course
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Curriculum</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td data-label="ID">#{course.id}</td>
                        <td data-label="Title" style={{ fontWeight: 500 }}>{course.title}</td>
                        <td data-label="Category"><span className={styles.badge}>{course.category}</span></td>
                        <td data-label="Curriculum">{course.chapterCount} Chapters</td>
                        <td data-label="Price">${course.price.toFixed(2)} {course.discountPct > 0 && <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '4px' }}>-{course.discountPct}%</span>}</td>
                        <td data-label="Status"><span style={{ color: '#10b981', fontWeight: 'bold' }}>Published</span></td>
                        <td data-label="Actions" style={{ display: 'flex', gap: '8px' }}>
                          <button className={styles.actionBtn} onClick={() => openEditModal(course)}>Edit</button>
                          <button className={styles.actionBtn} onClick={() => {
                            setSelectedCourseId(course.id);
                            fetchCourseChapters(course.id);
                            setActiveTab('curriculum');
                          }}>Manage</button>
                          <button className={styles.actionBtn} style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>You haven't created any courses yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && selectedCourseId && (
            <div className={styles.coursesSection}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                <button onClick={() => { setActiveTab('courses'); setSelectedCourseId(null); setChapters([]); }} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#374151', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
                  &larr; Back to Courses
                </button>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: 700 }}>Course Curriculum & Uploads</h3>
              </div>
              
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>Curriculum structure</h3>
                  <button onClick={() => setShowAddChapterModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>+ Add Chapter</button>
                </div>
                
                {chapters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#52525b' }}>No chapters found. Add curriculum first.</div>
                ) : (
                  chapters.map(chapter => (
                    <div key={chapter.id} style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {editingChapterTitle?.id === chapter.id ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                autoFocus
                                type="text"
                                value={editingChapterTitle?.title || ''}
                                onChange={e => setEditingChapterTitle({...editingChapterTitle!, title: e.target.value})}
                                style={{ padding: '2px 6px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                              />
                              <button onClick={() => handleUpdateChapterTitle(chapter.id, editingChapterTitle?.title || '')} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}>Save</button>
                              <button onClick={() => setEditingChapterTitle(null)} style={{ background: '#3f3f46', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '11px' }}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ marginRight: '8px' }}>{chapter.title}</span>
                              <button 
                                onClick={() => setEditingChapterTitle({ id: chapter.id, title: chapter.title })} 
                                style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#334155'}
                                onMouseOut={e => e.currentTarget.style.background = '#1e293b'}
                              >
                                <Pencil size={12} /> Rename
                              </button>
                              <button 
                                onClick={() => handleDeleteChapter(chapter.id)} 
                                style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#7f1d1d'}
                                onMouseOut={e => e.currentTarget.style.background = '#450a0a'}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}

                          {courses.find(c => c.id === selectedCourseId)?.isClasscutEnabled && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {editingChapterPrice?.id === chapter.id ? (
                                <>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    value={editingChapterPrice?.price || 0} 
                                    onChange={e => setEditingChapterPrice({...editingChapterPrice!, price: parseFloat(e.target.value) || 0})}
                                    style={{ width: '60px', padding: '2px 4px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                                  />
                                  <button onClick={() => handleUpdateChapterPrice(chapter.id, editingChapterPrice?.price || 0)} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}>Save</button>
                                  <button onClick={() => setEditingChapterPrice(null)} style={{ background: '#3f3f46', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '11px' }}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <span style={{ color: '#fbbf24', textTransform: 'none', background: '#451a03', padding: '3px 8px', borderRadius: '4px', border: '1px solid #78350f' }}>${chapter.price.toFixed(2)}</span>
                                  <button 
                                    onClick={() => setEditingChapterPrice({ id: chapter.id, price: chapter.price })} 
                                    style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'none', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#334155'}
                                    onMouseOut={e => e.currentTarget.style.background = '#1e293b'}
                                  >
                                    <Pencil size={12} /> Edit Price
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={() => { setAddingLessonChapterId(chapter.id); setNewLessonTitle(""); }} style={{ background: 'transparent', color: '#60a5fa', border: '1px solid #1d4ed8', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', padding: '3px 10px' }}>+ Add Lesson</button>
                      </div>
                      {chapter.lessons.map((lesson: any) => {
                        const status = uploadProgress[lesson.id];
                        const isUploading = uploadingLessonId === lesson.id;
                        return (
                          <div key={lesson.id} style={{ marginBottom: '8px' }}>
                            {/* Lesson row */}
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                              background: isUploading ? '#0f172a' : '#111113',
                              borderRadius: isUploading ? '8px 8px 0 0' : '8px',
                              border: `1px solid ${isUploading ? '#1d4ed8' : '#1f1f23'}`,
                              borderBottom: isUploading ? 'none' : undefined,
                              transition: 'all 0.2s'
                            }}>
                              {/* Lesson info */}
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingLesson?.id === lesson.id ? (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input 
                                      autoFocus
                                      type="text"
                                      value={editingLesson?.title || ''}
                                      onChange={e => setEditingLesson({...editingLesson!, title: e.target.value})}
                                      style={{ padding: '2px 6px', background: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                                    />
                                    <button onClick={() => handleUpdateLessonTitle(lesson, editingLesson?.title || '')} style={{ background: '#4ade80', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}>Save</button>
                                    <button onClick={() => setEditingLesson(null)} style={{ background: '#3f3f46', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '11px' }}>Cancel</button>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{lesson.title}</div>
                                      <div style={{ fontSize: '12px', color: '#71717a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span>{lesson.durationSeconds ? `${Math.floor(lesson.durationSeconds / 60)}:${(lesson.durationSeconds % 60).toString().padStart(2, '0')}` : '0m'}</span>
                                        {lesson.isFreePreview && <span style={{ color: '#4ade80', background: '#14532d', padding: '1px 6px', borderRadius: '4px' }}>FREE</span>}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                                      <button 
                                        onClick={() => setEditingLesson({ id: lesson.id, title: lesson.title })} 
                                        style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#334155'}
                                        onMouseOut={e => e.currentTarget.style.background = '#1e293b'}
                                      >
                                        <Pencil size={12} /> Edit
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteLesson(lesson.id)} 
                                        style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#7f1d1d'}
                                        onMouseOut={e => e.currentTarget.style.background = '#450a0a'}
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Status */}
                              <div style={{ minWidth: '150px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {lesson.vdoCipherVideoId && !isUploading && (
                                  <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={13} /> VdoCipher DRM Active
                                  </span>
                                )}
                                {!lesson.vdoCipherVideoId && !isUploading && (
                                  <span style={{ color: '#52525b' }}>No video uploaded</span>
                                )}
                                {isUploading && (
                                  <span style={{ color: '#60a5fa' }}>
                                    {uploadPercent[lesson.id] === 100 ? '⚙️ Encoding...' : `📤 ${uploadPercent[lesson.id] ?? 0}% uploaded`}
                                  </span>
                                )}
                                {!isUploading && status && (
                                  <span style={{ color: status.startsWith('✅') ? '#4ade80' : status.startsWith('❌') ? '#f87171' : '#facc15' }}>{status}</span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="video/*"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file && activeUploadLesson) handleVideoUpload(activeUploadLesson.id, file);
                                    e.target.value = '';
                                  }}
                                />

                                {isUploading ? (
                                  <button disabled style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                    background: '#1e3a8a', color: '#93c5fd',
                                    border: 'none', padding: '7px 16px', borderRadius: '6px',
                                    fontSize: '12px', fontWeight: 600, cursor: 'not-allowed', whiteSpace: 'nowrap'
                                  }}>
                                    <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                                    {uploadPercent[lesson.id] === 100 ? 'Encoding...' : `${uploadPercent[lesson.id] ?? 0}%`}
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {lesson.vdoCipherVideoId ? (
                                      <>
                                        <button
                                          onClick={() => { setActiveUploadLesson(lesson); setTimeout(() => fileInputRef.current?.click(), 50); }}
                                          style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >Replace</button>
                                        <button
                                          onClick={() => handleVideoDelete(lesson.id, lesson.title)}
                                          style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >Delete Video</button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => { setActiveUploadLesson(lesson); setTimeout(() => fileInputRef.current?.click(), 50); }}
                                        style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >Upload Video</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Progress bar — shown while uploading */}
                            {isUploading && (
                              <div style={{
                                background: '#0a1628',
                                border: '1px solid #1d4ed8', borderTop: 'none',
                                borderRadius: '0 0 8px 8px',
                                padding: '10px 14px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#93c5fd' }}>
                                  <span>
                                    {uploadPercent[lesson.id] === 100
                                      ? '⚙️ VdoCipher is encoding your video...'
                                      : '📤 Uploading to VdoCipher'}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>{uploadPercent[lesson.id] ?? 0}%</span>
                                </div>
                                <div style={{ height: '8px', background: '#1e3a8a', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%', width: `${uploadPercent[lesson.id] ?? 0}%`,
                                    background: (uploadPercent[lesson.id] ?? 0) === 100 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #6366f1, #3b82f6)',
                                    borderRadius: '99px', transition: 'width 0.25s ease', boxShadow: '0 0 8px rgba(99,102,241,0.6)'
                                  }} />
                                </div>
                                {(uploadPercent[lesson.id] ?? 0) === 100 && (
                                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#4ade80' }}>
                                    ✅ Upload complete — encoding takes 2–5 minutes
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Inline Add Lesson form */}
                      {addingLessonChapterId === chapter.id && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', padding: '10px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1d4ed8' }}>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Lesson title..."
                            value={newLessonTitle}
                            onChange={e => setNewLessonTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddLesson(chapter.id); if (e.key === 'Escape') setAddingLessonChapterId(null); }}
                            style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                          />
                          <button onClick={() => handleAddLesson(chapter.id)} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Add</button>
                          <button onClick={() => setAddingLessonChapterId(null)} style={{ background: '#27272a', color: '#a1a1aa', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (() => {
            let portfolioImages: string[] = [];
            try { portfolioImages = JSON.parse(profile.portfolioImagesJson || '[]'); } catch {}
            const addPortfolioImage = (url: string) => {
              const trimmed = url.trim();
              if (!trimmed || portfolioImages.includes(trimmed)) return;
              const next = [...portfolioImages, trimmed];
              setProfile({ ...profile, portfolioImagesJson: JSON.stringify(next) });
            };
            const removePortfolioImage = (idx: number) => {
              const next = portfolioImages.filter((_, i) => i !== idx);
              setProfile({ ...profile, portfolioImagesJson: JSON.stringify(next) });
            };
            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              setIsDraggingOver(false);
              const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
              if (text) { text.split('\n').forEach(u => addPortfolioImage(u)); return; }
              Array.from(e.dataTransfer.files).forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = ev => { if (ev.target?.result) addPortfolioImage(ev.target.result as string); };
                reader.readAsDataURL(file);
              });
            };
            return (
              <div className={styles.coursesSection}>
                <div style={{ padding: '28px', background: '#18181b', border: '1px solid #27272a', borderRadius: '16px' }}>
                  {/* Header with avatar + current info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #27272a' }}>
                    <img
                      src={session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'I')}&background=6366f1&color=fff&size=80`}
                      alt="avatar"
                      style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #6366f1', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>{session?.user?.name}</div>
                      <div style={{ fontSize: '13px', color: '#71717a', marginTop: '2px' }}>{session?.user?.email}</div>
                      {profile.headline
                        ? <div style={{ fontSize: '13px', color: '#a78bfa', marginTop: '6px', fontStyle: 'italic' }}>"{profile.headline}"</div>
                        : <div style={{ fontSize: '12px', color: '#52525b', marginTop: '6px' }}>No headline set yet</div>
                      }
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile}>
                    <div style={{ display: 'grid', gap: '20px' }}>

                      {/* Headline */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Professional Headline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Lead Illustrator / Concept Artist"
                          value={profile.headline}
                          onChange={e => setProfile({ ...profile, headline: e.target.value })}
                          style={{ width: '100%', padding: '11px 14px', background: '#111113', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Bio */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Instructor Bio
                        </label>
                        <textarea
                          placeholder="Tell students about your experience, past projects, and what you will teach..."
                          rows={5}
                          value={profile.bio}
                          onChange={e => setProfile({ ...profile, bio: e.target.value })}
                          style={{ width: '100%', padding: '11px 14px', background: '#111113', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                        />
                        {profile.bio && <div style={{ fontSize: '11px', color: '#52525b', marginTop: '4px', textAlign: 'right' }}>{profile.bio.length} ký tự</div>}
                      </div>

                      {/* Social */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎬 YouTube URL</label>
                          <input
                            type="url"
                            placeholder="https://youtube.com/@channel"
                            value={profile.youtubeUrl}
                            onChange={e => setProfile({ ...profile, youtubeUrl: e.target.value })}
                            style={{ width: '100%', padding: '11px 14px', background: '#111113', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                          />
                          {profile.youtubeUrl && <a href={profile.youtubeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px', display: 'inline-block' }}>↗ View channel</a>}
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🐦 Twitter / X URL</label>
                          <input
                            type="url"
                            placeholder="https://x.com/username"
                            value={profile.twitterUrl}
                            onChange={e => setProfile({ ...profile, twitterUrl: e.target.value })}
                            style={{ width: '100%', padding: '11px 14px', background: '#111113', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                          />
                          {profile.twitterUrl && <a href={profile.twitterUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px', display: 'inline-block' }}>↗ View profile</a>}
                        </div>
                      </div>

                      {/* Portfolio Images */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          🖼️ Portfolio Images
                          <span style={{ color: '#52525b', fontWeight: 400, textTransform: 'none', marginLeft: '8px' }}>
                            {portfolioImages.length > 0 ? `${portfolioImages.length} ảnh hiện tại` : 'Chưa có ảnh nào'}
                          </span>
                        </label>

                        {/* Image previews */}
                        {portfolioImages.length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                            {portfolioImages.map((url, idx) => (
                              <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1/1', background: '#111113', border: '1px solid #3f3f46' }}>
                                <img
                                  src={url}
                                  alt={`Portfolio ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removePortfolioImage(idx)}
                                  style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(15,15,15,0.85)', color: '#f87171', border: '1px solid #3f3f46', borderRadius: '50%', width: '24px', height: '24px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 }}
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Drop zone */}
                        <div
                          onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
                          onDragLeave={() => setIsDraggingOver(false)}
                          onDrop={handleDrop}
                          style={{
                            border: `2px dashed ${isDraggingOver ? '#6366f1' : '#3f3f46'}`,
                            borderRadius: '10px',
                            padding: '28px 20px',
                            textAlign: 'center',
                            background: isDraggingOver ? 'rgba(99,102,241,0.07)' : '#111113',
                            transition: 'all 0.2s ease',
                            cursor: 'default',
                            marginBottom: '10px'
                          }}
                        >
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{isDraggingOver ? '📥' : '🖼️'}</div>
                          <div style={{ fontSize: '14px', color: isDraggingOver ? '#a78bfa' : '#71717a', fontWeight: 600, marginBottom: '4px' }}>
                            {isDraggingOver ? 'Thả ảnh vào đây' : 'Kéo & thả file ảnh hoặc URL vào đây'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#52525b' }}>Hỗ trợ: JPG, PNG, WebP, GIF</div>
                        </div>

                        {/* URL paste input */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="url"
                            placeholder="Hoặc dán URL ảnh rồi nhấn Enter..."
                            value={portfolioUrlInput}
                            onChange={e => setPortfolioUrlInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPortfolioImage(portfolioUrlInput); setPortfolioUrlInput(''); } }}
                            style={{ flex: 1, padding: '9px 14px', background: '#111113', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => { addPortfolioImage(portfolioUrlInput); setPortfolioUrlInput(''); }}
                            style={{ background: '#27272a', color: '#d4d4d8', border: '1px solid #3f3f46', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >+ Add URL</button>
                        </div>
                      </div>

                      {/* Save button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #27272a' }}>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          style={{ background: isSavingProfile ? '#52525b' : '#f59e0b', color: '#000', border: 'none', padding: '11px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: isSavingProfile ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                        >
                          {isSavingProfile ? '⏳ Đang lưu...' : '💾 Save Profile'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            );
          })()}
        </div>
      </main>


      {/* MODAL FOR NEW COURSE */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Create New Course</h3>
              <button onClick={() => setShowAddModal(false)} className={styles.closeBtn}>&times;</button>
            </div>
            <form onSubmit={handleAddCourse} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Course Title</label>
                <input type="text" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea required value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} rows={3} style={{ width: '100%', padding: '10px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select required value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})}>
                    <option value="Illustration">Illustration</option>
                    <option value="3D Art">3D Art</option>
                    <option value="Concept Art">Concept Art</option>
                    <option value="Animation">Animation</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Selling Price ($)</label>
                  <input type="number" required step="0.01" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Original Price ($)</label>
                  <input type="number" required step="0.01" value={newCourse.originalPrice} onChange={e => setNewCourse({...newCourse, originalPrice: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Thumbnail Image URL</label>
                <input type="url" required value={newCourse.thumbnailUrl} onChange={e => setNewCourse({...newCourse, thumbnailUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Level</label>
                  <select value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})}>
                    <option value="Basic">Basic</option>
                    <option value="Basic~Advanced">Basic~Advanced</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Audio Language</label>
                  <input type="text" value={newCourse.audioLanguage} onChange={e => setNewCourse({...newCourse, audioLanguage: e.target.value})} placeholder="e.g. English" />
                </div>
                <div className={styles.formGroup}>
                  <label>Subtitle Language</label>
                  <input type="text" value={newCourse.subtitleLanguage} onChange={e => setNewCourse({...newCourse, subtitleLanguage: e.target.value})} placeholder="e.g. English, Vietnamese" />
                </div>
              </div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '16px' }}>
                <input type="checkbox" id="includesMaterials" checked={newCourse.includesMaterials} onChange={e => setNewCourse({...newCourse, includesMaterials: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="includesMaterials" style={{ marginBottom: 0, cursor: 'pointer' }}>Includes Class Materials</label>
              </div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                <input type="checkbox" id="isClasscutEnabled" checked={newCourse.isClasscutEnabled} onChange={e => setNewCourse({...newCourse, isClasscutEnabled: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="isClasscutEnabled" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable Classcut (Allow purchasing individual chapters)</label>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn} style={{ background: '#f59e0b', color: '#000' }}>Publish Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CHAPTER MODAL */}
      {showAddChapterModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '420px' }}>
            <div className={styles.modalHeader}>
              <h3>Add New Chapter</h3>
              <button onClick={() => setShowAddChapterModal(false)} className={styles.closeBtn}>&times;</button>
            </div>
            <form onSubmit={handleAddChapter} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Chapter Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Introduction to Digital Painting"
                  value={newChapterTitle}
                  onChange={e => setNewChapterTitle(e.target.value)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddChapterModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn} style={{ background: '#6366f1' }}>Add Chapter</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '520px' }}>
            <div className={styles.modalHeader}>
              <h3>Edit Course #{editingCourse.id}</h3>
              <button onClick={() => setEditingCourse(null)} className={styles.closeBtn}>&times;</button>
            </div>
            <form onSubmit={handleEditCourse} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Course Title</label>
                <input type="text" required value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                  {['Illustration','Concept Art','3D Art','Animation','Character Design','Environment Art','UI/UX','Photography'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Selling Price ($)</label>
                  <input type="number" step="0.01" min="0" required value={editForm.price}
                    onChange={e => setEditForm({...editForm, price: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Original Price ($) <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span></label>
                  <input type="number" step="0.01" min="0" placeholder={editForm.price}
                    value={editForm.originalPrice}
                    onChange={e => setEditForm({...editForm, originalPrice: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Thumbnail</label>
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDraggingThumb(true); }}
                  onDragLeave={() => setIsDraggingThumb(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDraggingThumb(false);
                    // Try dragged URL first
                    const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
                    if (url && url.startsWith('http')) { setEditForm(f => ({...f, thumbnailUrl: url.split('\n')[0].trim()})); return; }
                    // Try dragged file
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = ev => { if (ev.target?.result) setEditForm(f => ({...f, thumbnailUrl: ev.target!.result as string})); };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{
                    border: `2px dashed ${isDraggingThumb ? '#6366f1' : '#3f3f46'}`,
                    borderRadius: '10px',
                    background: isDraggingThumb ? 'rgba(99,102,241,0.08)' : '#111113',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    minHeight: editForm.thumbnailUrl ? 'auto' : '120px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative',
                  }}
                  onClick={() => document.getElementById('thumbFileInput')?.click()}
                >
                  {editForm.thumbnailUrl ? (
                    <>
                      <img
                        src={editForm.thumbnailUrl}
                        alt="preview"
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', display: 'block', borderRadius: '8px' }}
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s', borderRadius: '8px',
                      }}
                        className="thumbOverlay"
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <span style={{ fontSize: '28px' }}>🖼️</span>
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>Click or drag to replace</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', pointerEvents: 'none', padding: '16px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                      <div style={{ color: '#71717a', fontSize: '13px', fontWeight: 500 }}>
                        {isDraggingThumb ? 'Drop image here!' : 'Drag & drop an image, or click to browse'}
                      </div>
                      <div style={{ color: '#52525b', fontSize: '11px', marginTop: '4px' }}>PNG, JPG, WebP — or drag any image URL from browser</div>
                    </div>
                  )}
                  <input
                    id="thumbFileInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => { if (ev.target?.result) setEditForm(f => ({...f, thumbnailUrl: ev.target!.result as string})); };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                {/* URL input fallback */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input
                    type="url"
                    value={editForm.thumbnailUrl.startsWith('data:') ? '' : editForm.thumbnailUrl}
                    onChange={e => setEditForm({...editForm, thumbnailUrl: e.target.value})}
                    placeholder="Or paste image URL here..."
                    style={{ flex: 1, padding: '8px 12px', background: '#111113', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  {editForm.thumbnailUrl && (
                    <button type="button" onClick={() => setEditForm(f => ({...f, thumbnailUrl: ''}))}
                      style={{ padding: '8px 12px', background: '#27272a', border: 'none', borderRadius: '6px', color: '#a1a1aa', cursor: 'pointer', fontSize: '13px' }}>
                      ✕ Clear
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" id="editClasscut" checked={editForm.isClasscutEnabled}
                  onChange={e => setEditForm({...editForm, isClasscutEnabled: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="editClasscut" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable Classcut</label>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setEditingCourse(null)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
