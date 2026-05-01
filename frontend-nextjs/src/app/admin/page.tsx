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

  const fetchData = async () => {
    // @ts-ignore
    const token = session?.backendToken;
    if (!token) return;

    try {
      const [statsRes, coursesRes, usersRes] = await Promise.all([
        fetch("http://localhost:5149/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5149/api/admin/courses", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5149/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // @ts-ignore
    if (status === "authenticated" && session?.user?.role === "Admin") {
      fetchData();
    // @ts-ignore
    } else if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "Admin")) {
      window.location.href = "/";
    }
  }, [status, session]);

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
    if (!confirm("Are you sure you want to delete this user? (This will also delete their courses and videos if they are a tutor)")) return;
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`http://localhost:5149/api/admin/tutors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fallback for normal user deletion
      if (!res.ok && res.status === 404) {
        await fetch(`http://localhost:5149/api/admin/users/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert("User and associated data deleted");
      fetchData();
    } catch (err) {
      alert("Error deleting user");
    }
  };

  const handleToggleBan = async (id: number, currentBanState: boolean) => {
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`http://localhost:5149/api/admin/users/${id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isBanned: !currentBanState })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Error toggling ban status");
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course and ALL its videos?")) return;
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`http://localhost:5149/api/admin/courses/${id}`, {
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
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h2>{activeTab === 'dashboard' ? 'Overview' : activeTab === 'courses' ? 'Course Management' : 'User Management'}</h2>
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
                          <button className={styles.actionBtn} style={{ color: '#ef4444', borderColor: '#fca5a5', marginLeft: '8px' }} onClick={() => handleDeleteCourse(course.id)}>Delete</button>
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
                          {/* @ts-ignore */}
                          <button className={styles.actionBtn} style={{ background: user.isBanned ? '#10b981' : '#f59e0b', color: '#fff', borderColor: 'transparent', marginRight: '8px' }} onClick={() => handleToggleBan(user.id, user.isBanned || false)}>
                            {/* @ts-ignore */}
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </button>
                          <button className={styles.actionBtn} style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteUser(user.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
