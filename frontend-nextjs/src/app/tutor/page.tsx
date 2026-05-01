"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, DollarSign, Users, Plus, Star, CheckCircle2, Loader2 } from "lucide-react";
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

  // Profile form state
  const [profile, setProfile] = useState({ headline: "", bio: "", youtubeUrl: "", twitterUrl: "", portfolioImagesJson: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New course form
  const [newCourse, setNewCourse] = useState({
    title: "", category: "Illustration", price: "", originalPrice: "", thumbnailUrl: "", description: "", isClasscutEnabled: false,
    level: "Basic~Advanced", audioLanguage: "English", subtitleLanguage: "English, Vietnamese", includesMaterials: true
  });

  // Video upload & curriculum state
  type LessonWithStatus = { id: number; title: string; isFreePreview: boolean; durationMinutes: number; vdoCipherVideoId?: string; };
  type ChapterWithLessons = { id: number; title: string; lessons: LessonWithStatus[]; };
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
  const [uploadingLessonId, setUploadingLessonId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<number, string>>({}); // lessonId -> status msg
  const [uploadPercent, setUploadPercent] = useState<Record<number, number>>({}); // lessonId -> 0-100
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadLesson, setActiveUploadLesson] = useState<LessonWithStatus | null>(null);

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
      
      const statsRes = await fetch("http://localhost:5149/api/tutor/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      const coursesRes = await fetch("http://localhost:5149/api/tutor/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (coursesRes.ok) setCourses(await coursesRes.json());
      
      const profileRes = await fetch("http://localhost:5149/api/tutor/profile", {
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
      const res = await fetch("http://localhost:5149/api/tutor/courses", {
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
      const res = await fetch("http://localhost:5149/api/tutor/profile", {
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
      const res = await fetch(`http://localhost:5149/api/tutor/courses/${id}`, {
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

  const fetchCourseChapters = async (courseId: number) => {
    const token = (session as any)?.backendToken;
    const res = await fetch(`http://localhost:5149/api/tutor/courses/${courseId}/curriculum`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      setChapters(data || []);
    }
  };

  const handleVideoUpload = async (lessonId: number, file: File) => {
    const token = (session as any)?.backendToken;
    if (!token) { alert("Not authenticated"); return; }

    setUploadingLessonId(lessonId);
    setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
    setUploadProgress(p => ({ ...p, [lessonId]: "Preparing..." }));

    const formData = new FormData();
    formData.append("file", file);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPercent(p => ({ ...p, [lessonId]: pct }));
          setUploadProgress(p => ({ ...p, [lessonId]: pct < 100 ? `Uploading... ${pct}%` : "Processing on VdoCipher..." }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(p => ({ ...p, [lessonId]: "✅ Done! Encoding in progress..." }));
          setUploadPercent(p => ({ ...p, [lessonId]: 100 }));
          if (selectedCourseId) fetchCourseChapters(selectedCourseId);
        } else {
          setUploadProgress(p => ({ ...p, [lessonId]: `❌ Error: ${xhr.responseText}` }));
          setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
        }
        setUploadingLessonId(null);
        setActiveUploadLesson(null);
        resolve();
      });

      xhr.addEventListener("error", () => {
        setUploadProgress(p => ({ ...p, [lessonId]: "❌ Network error" }));
        setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
        setUploadingLessonId(null);
        setActiveUploadLesson(null);
        resolve();
      });

      // NOTE: Here we still call the admin endpoint because VdoCipher logic is the same, 
      // but we should technically have a tutor endpoint. We added upload-credentials 
      // and attach-video in TutorController. Let's use the new flow or just the admin one 
      // if it works... wait, the admin endpoint validates role="Admin". 
      // We must call the admin endpoint? No, let's just allow Instructor to call VdoCipher direct upload? 
      // Actually, wait... ArtLab.Backend/Controllers/AdminController has `/vdocipher/lessons/{lessonId}/upload` 
      // which uses `[Authorize(Roles = "Admin")]`. 
      // Let's create `/vdocipher/lessons/{lessonId}/upload` for `TutorController`! 
      // Ah, for now, let's send to a new endpoint we'll create in TutorController: `api/tutor/lessons/${lessonId}/upload`
      xhr.open("POST", `http://localhost:5149/api/tutor/lessons/${lessonId}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleVideoDelete = async (lessonId: number, lessonTitle: string) => {
    if (!confirm(`Delete video for "${lessonTitle}"? This cannot be undone.`)) return;
    const token = (session as any)?.backendToken;
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5149/api/tutor/lessons/${lessonId}/video`, {
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
      <aside className={styles.sidebar}>
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
          <h2>{activeTab === 'dashboard' ? 'Studio Overview' : activeTab === 'courses' ? 'My Courses' : 'Instructor Profile'}</h2>
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
                        <td>#{course.id}</td>
                        <td style={{ fontWeight: 500 }}>{course.title}</td>
                        <td><span className={styles.badge}>{course.category}</span></td>
                        <td>{course.chapterCount} Chapters</td>
                        <td>${course.price.toFixed(2)} {course.discountPct > 0 && <span style={{ color: '#ef4444', fontSize: '11px', marginLeft: '4px' }}>-{course.discountPct}%</span>}</td>
                        <td><span style={{ color: '#10b981', fontWeight: 'bold' }}>Published</span></td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button className={styles.actionBtn} onClick={() => {
                            setSelectedCourseId(course.id);
                            fetchCourseChapters(course.id);
                            setActiveTab('curriculum');
                          }}>Manage Curriculum</button>
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
                <button onClick={() => { setActiveTab('courses'); setSelectedCourseId(null); setChapters([]); }} style={{ background: 'transparent', border: '1px solid #3f3f46', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                  &larr; Back to Courses
                </button>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Course Curriculum & Uploads</h3>
              </div>
              
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>Curriculum structure</h3>
                  {/* Future: Add Chapter button here */}
                  <button style={{ background: '#3f3f46', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>+ Add Chapter</button>
                </div>
                
                {chapters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#52525b' }}>No chapters found. Add curriculum first.</div>
                ) : (
                  chapters.map(chapter => (
                    <div key={chapter.id} style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{chapter.title}</span>
                        <button style={{ background: 'transparent', color: '#60a5fa', border: 'none', fontSize: '12px', cursor: 'pointer' }}>+ Add Lesson</button>
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
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{lesson.title}</div>
                                <div style={{ fontSize: '12px', color: '#71717a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span>{lesson.durationMinutes}m</span>
                                  {lesson.isFreePreview && <span style={{ color: '#4ade80', background: '#14532d', padding: '1px 6px', borderRadius: '4px' }}>FREE</span>}
                                </div>
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
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.coursesSection}>
              <div style={{ padding: '24px', background: '#18181b', border: '1px solid #27272a', borderRadius: '16px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '18px', color: '#fff' }}>Edit Instructor Profile</h3>
                <form onSubmit={handleSaveProfile} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label>Professional Headline</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Lead Illustrator / Concept Artist" 
                      value={profile.headline} 
                      onChange={e => setProfile({...profile, headline: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                    <label>Instructor Bio</label>
                    <textarea 
                      placeholder="Tell students about your experience, past projects, and what you will teach..." 
                      rows={6}
                      value={profile.bio} 
                      onChange={e => setProfile({...profile, bio: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                    <label>YouTube URL</label>
                    <input 
                      type="url" 
                      placeholder="https://youtube.com/..." 
                      value={profile.youtubeUrl} 
                      onChange={e => setProfile({...profile, youtubeUrl: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                    <label>Twitter/X URL</label>
                    <input 
                      type="url" 
                      placeholder="https://twitter.com/..." 
                      value={profile.twitterUrl} 
                      onChange={e => setProfile({...profile, twitterUrl: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                    <label>Portfolio Images (JSON Array)</label>
                    <textarea 
                      placeholder='["https://image1.jpg", "https://image2.jpg"]' 
                      rows={3}
                      value={profile.portfolioImagesJson} 
                      onChange={e => setProfile({...profile, portfolioImagesJson: e.target.value})} 
                      style={{ width: '100%', padding: '10px 14px', background: '#111113', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={isSavingProfile} className={styles.submitBtn} style={{ background: '#f59e0b', color: '#000', opacity: isSavingProfile ? 0.7 : 1 }}>
                      {isSavingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
    </div>
  );
}
