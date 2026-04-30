"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, DollarSign, Plus, Video, Upload, CheckCircle2, Loader2 } from "lucide-react";
import styles from "./page.module.css";

type Stats = {
  totalUsers: number;
  totalCourses: number;
  totalSales: number;
  totalOrders: number;
};

type Course = {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  isClasscutEnabled: boolean;
};

type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New course form state
  const [newCourse, setNewCourse] = useState({
    title: "", author: "", category: "", price: "", originalPrice: "", thumbnailUrl: "", isClasscutEnabled: false
  });

  // Video upload state
  type LessonWithStatus = { id: number; title: string; isFreePreview: boolean; durationMinutes: number; bunnyVideoId?: string; };
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
    if (session) {
      fetchData();
    }
  }, [session, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const token = session.backendToken;
      
      // Fetch Stats
      const statsRes = await fetch("http://localhost:5149/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      // Fetch Courses
      const coursesRes = await fetch("http://localhost:5149/api/courses");
      if (coursesRes.ok) setCourses(await coursesRes.json());
      
      // Fetch Users
      const usersRes = await fetch("http://localhost:5149/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) setUsers(await usersRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseChapters = async (courseId: number) => {
    // @ts-ignore
    const token = session?.backendToken;
    const res = await fetch(`http://localhost:5149/api/lessons/course/${courseId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      setChapters(data.chapters || []);
    }
  };

  const handleVideoUpload = async (lessonId: number, file: File) => {
    // @ts-ignore
    const token = session?.backendToken;
    if (!token) { alert("Not authenticated"); return; }

    setUploadingLessonId(lessonId);
    setUploadPercent(p => ({ ...p, [lessonId]: 0 }));
    setUploadProgress(p => ({ ...p, [lessonId]: "Preparing..." }));

    const formData = new FormData();
    formData.append("file", file);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadPercent(p => ({ ...p, [lessonId]: pct }));
          setUploadProgress(p => ({ ...p, [lessonId]: pct < 100 ? `Uploading... ${pct}%` : "Processing on Bunny..." }));
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

      xhr.open("POST", `http://localhost:5149/api/admin/bunny/lessons/${lessonId}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleVideoDelete = async (lessonId: number, lessonTitle: string) => {
    if (!confirm(`Delete Bunny video for "${lessonTitle}"? This cannot be undone.`)) return;
    // @ts-ignore
    const token = session?.backendToken;
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5149/api/admin/bunny/lessons/${lessonId}/video`, {
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

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch("http://localhost:5149/api/admin/courses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: newCourse.title,
          author: newCourse.author,
          category: newCourse.category,
          price: parseFloat(newCourse.price),
          originalPrice: parseFloat(newCourse.originalPrice),
          thumbnailUrl: newCourse.thumbnailUrl,
          isClasscutEnabled: newCourse.isClasscutEnabled
        })
      });

      if (res.ok) {
        alert("Course created successfully!");
        setShowAddModal(false);
        setNewCourse({ title: "", author: "", category: "", price: "", originalPrice: "", thumbnailUrl: "", isClasscutEnabled: false });
        fetchData(); // Refresh list
      }
    } catch (err) {
      alert("Error creating course");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`http://localhost:5149/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("User deleted");
        fetchData();
      } else {
        const errorText = await res.text();
        alert(errorText);
      }
    } catch (err) {
      alert("Error deleting user");
    }
  };

  if (status === "loading" || loading) return <div className={styles.loading}>Loading Workspace...</div>;

  return (
    <div className={styles.adminLayout}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/">
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>ArtLab <span style={{color: '#6366f1'}}>Admin</span></span>
          </Link>
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'users' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={20} /> Users
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'courses' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("courses")}
          >
            <BookOpen size={20} /> Courses
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'videos' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab("videos")}
          >
            <Video size={20} /> Videos 🐇
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h2>{activeTab === 'dashboard' ? 'Overview' : activeTab === 'videos' ? '🐇 Bunny Video Upload' : 'Course Management'}</h2>
          <div className={styles.userProfile}>
            <img src={session?.user?.image || ""} alt="" className={styles.avatar} />
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'dashboard' && stats && (
            <div className={styles.dashboardGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#e0e7ff', color: '#4f46e5' }}><DollarSign size={24} /></div>
                <div>
                  <p className={styles.statLabel}>Total Revenue</p>
                  <h3 className={styles.statValue}>${stats.totalSales.toFixed(2)}</h3>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#16a34a' }}><Users size={24} /></div>
                <div>
                  <p className={styles.statLabel}>Total Users</p>
                  <h3 className={styles.statValue}>{stats.totalUsers}</h3>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}><BookOpen size={24} /></div>
                <div>
                  <p className={styles.statLabel}>Total Courses</p>
                  <h3 className={styles.statValue}>{stats.totalCourses}</h3>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className={styles.coursesSection}>
              <div className={styles.toolbar}>
                <input type="text" placeholder="Search courses..." className={styles.searchInput} />
                <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                  <Plus size={16} /> New Course
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Classcut</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td>#{course.id}</td>
                        <td style={{ fontWeight: 500 }}>{course.title}</td>
                        <td>{course.author}</td>
                        <td><span className={styles.badge}>{course.category}</span></td>
                        <td>{course.isClasscutEnabled ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>Yes</span> : <span style={{ color: '#ef4444' }}>No</span>}</td>
                        <td>${course.price.toFixed(2)}</td>
                        <td>
                          <button className={styles.actionBtn}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div className={styles.coursesSection}>
              <div className={styles.toolbar}>
                <input type="text" placeholder="Search users by name or email..." className={styles.searchInput} />
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td style={{ fontWeight: 500 }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={styles.badge} style={{ 
                            background: user.role === 'Admin' ? '#fef2f2' : '#e0e7ff', 
                            color: user.role === 'Admin' ? '#ef4444' : '#4f46e5' 
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className={styles.actionBtn} style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteUser(user.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIDEO UPLOAD TAB ── */}
          {activeTab === 'videos' && (
            <div style={{ padding: '0 0 40px' }}>
              {/* Step 1: Select course */}
              <div style={{ marginBottom: '24px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>1. Select Course</h3>
                <select
                  style={{ width: '100%', padding: '10px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
                  value={selectedCourseId ?? ''}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setSelectedCourseId(id);
                    setChapters([]);
                    if (id) fetchCourseChapters(id);
                  }}
                >
                  <option value=''>-- Choose a course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} (by {c.author})</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Upload per lesson */}
              {selectedCourseId && chapters.length > 0 && (
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>2. Upload Videos per Lesson</h3>
                  {chapters.map(chapter => (
                    <div key={chapter.id} style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #27272a' }}>
                        {chapter.title}
                      </div>
                      {chapter.lessons.map((lesson: any) => {
                        const status = uploadProgress[lesson.id];
                        const isUploading = uploadingLessonId === lesson.id;
                        const hasBunny = !!lesson.bunnyVideoId;
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
                              <div style={{ minWidth: '200px', fontSize: '12px' }}>
                                {hasBunny && !isUploading ? (
                                  <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={13} /> Bunny DRM active
                                  </span>
                                ) : isUploading ? (
                                  <span style={{ color: '#60a5fa' }}>
                                    {uploadPercent[lesson.id] === 100 ? '⚙️ Encoding...' : `📤 ${uploadPercent[lesson.id] ?? 0}% uploaded`}
                                  </span>
                                ) : status ? (
                                  <span style={{ color: status.startsWith('✅') ? '#4ade80' : status.startsWith('❌') ? '#f87171' : '#facc15' }}>{status}</span>
                                ) : (
                                  <span style={{ color: '#52525b' }}>No video</span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    background: '#1e3a8a', color: '#93c5fd',
                                    border: 'none', padding: '7px 16px', borderRadius: '6px',
                                    fontSize: '12px', fontWeight: 600, cursor: 'not-allowed', whiteSpace: 'nowrap'
                                  }}>
                                    <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
                                    {uploadPercent[lesson.id] === 100 ? 'Encoding...' : `${uploadPercent[lesson.id] ?? 0}%`}
                                  </button>
                                ) : hasBunny ? (
                                  <>
                                    <button
                                      title="Replace video on Bunny"
                                      onClick={() => { setActiveUploadLesson(lesson); setTimeout(() => fileInputRef.current?.click(), 50); }}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: '#1d4ed8', color: '#fff',
                                        border: 'none', padding: '7px 13px', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <Upload size={12} /> Replace
                                    </button>
                                    <button
                                      title="Delete video from Bunny"
                                      onClick={() => handleVideoDelete(lesson.id, lesson.title)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: '#7f1d1d', color: '#fca5a5',
                                        border: '1px solid #991b1b', padding: '7px 13px', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                      }}
                                    >
                                      🗑️ Delete
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => { setActiveUploadLesson(lesson); setTimeout(() => fileInputRef.current?.click(), 50); }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      background: '#4f46e5', color: '#fff',
                                      border: 'none', padding: '7px 13px', borderRadius: '6px',
                                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <Upload size={12} /> Upload
                                  </button>
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
                                      ? '⚙️ Bunny is encoding your video...'
                                      : '📤 Uploading to Bunny.net'}
                                  </span>
                                  <span style={{ fontWeight: 700 }}>{uploadPercent[lesson.id] ?? 0}%</span>
                                </div>
                                {/* Track */}
                                <div style={{ height: '8px', background: '#1e3a8a', borderRadius: '99px', overflow: 'hidden' }}>
                                  {/* Fill */}
                                  <div style={{
                                    height: '100%',
                                    width: `${uploadPercent[lesson.id] ?? 0}%`,
                                    background: (uploadPercent[lesson.id] ?? 0) === 100
                                      ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                      : 'linear-gradient(90deg, #6366f1, #3b82f6)',
                                    borderRadius: '99px',
                                    transition: 'width 0.25s ease',
                                    boxShadow: '0 0 8px rgba(99,102,241,0.6)'
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
                  ))}
                </div>
              )}

              {selectedCourseId && chapters.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#52525b' }}>No chapters found. Add curriculum first.</div>
              )}
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
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Instructor Name</label>
                  <input type="text" required value={newCourse.author} onChange={e => setNewCourse({...newCourse, author: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select required value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})}>
                    <option value="">Select Category</option>
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
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" id="isClasscutEnabled" checked={newCourse.isClasscutEnabled} onChange={e => setNewCourse({...newCourse, isClasscutEnabled: e.target.checked})} style={{ width: 'auto' }} />
                <label htmlFor="isClasscutEnabled" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable Classcut (Sell Individual Chapters)</label>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Publish Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
