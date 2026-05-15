"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, DollarSign, Video, Upload, CheckCircle2, Loader2, Menu, Activity, ArrowUpRight, TrendingUp, ChevronDown, Globe, LogOut, User } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, TRANSLATIONS } from '@/lib/translations';
import { signOut } from 'next-auth/react';
import styles from "./page.module.css";

function getJwtSub(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (
      payload.sub ??
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      null
    );
  } catch {
    return null;
  }
}

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

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const { lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const [salesData, setSalesData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);

  const currentLangMeta = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return (TRANSLATIONS[lang as keyof typeof TRANSLATIONS] as any)?.[key] || TRANSLATIONS.en[key];
  };

  const fetchData = async () => {
    const token = (session as any)?.backendToken;
    if (!token) return;

    try {
      const [statsRes, coursesRes, usersRes, advStatsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/advanced-stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (advStatsRes.ok) {
        const advData = await advStatsRes.json();
        if (advData.salesData?.length > 0) setSalesData(advData.salesData.reverse());
        if (advData.userGrowthData?.length > 0) setUserGrowthData(advData.userGrowthData.reverse());
        if (advData.categoryData?.length > 0) setCategoryData(advData.categoryData);
        if (advData.sourceData?.length > 0) setSourceData(advData.sourceData);
      }
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (session as any)?.role;
    if (status === "authenticated" && (role === "Admin" || role === "Moderator")) {
      fetchData();
    } else if (status === "unauthenticated" || (status === "authenticated" && role !== "Admin" && role !== "Moderator")) {
      window.location.href = "/";
    }
  }, [status, session]);


  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? (This will also delete their courses and videos if they are a tutor)")) return;
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/tutors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fallback for normal user deletion
      if (!res.ok && res.status === 404) {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/users/${id}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/users/${id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isBanned: !currentBanState })
      });
      if (res.ok) {
        fetchData();
      } else {
        const errorText = await res.text();
        alert("Failed to ban user: " + errorText);
      }
    } catch (err) {
      alert("Error toggling ban status");
    }
  };

  const currentUserId = useMemo(
    () => getJwtSub((session as any)?.backendToken),
    [(session as any)?.backendToken]
  );

  const handleChangeRole = async (userId: number, newRole: string) => {
    if (String(userId) === currentUserId) {
      alert("Bạn không thể tự đổi role của chính mình.");
      return;
    }
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? "Không thể đổi role.");
      }
    } catch {
      alert("Lỗi kết nối khi đổi role.");
    }
  };


  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course and ALL its videos?")) return;
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/admin/courses/${id}`, {
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

  if ((loading && !stats) || (status === "loading" && !session)) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.spinner}></div>
        <div className={styles.loaderText}>Loading Workspace...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoArea}>
          <Link href="/">
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>ArtLab <span style={{color: '#8b5cf6'}}>Admin</span></span>
          </Link>
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.activeNav : ''}`}
            onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
          >
            <LayoutDashboard size={20} /> {t('dashboardOverview') || 'Overview'}
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'users' ? styles.activeNav : ''}`}
            onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}
          >
            <Users size={20} /> {t('userManagement') || 'User Management'}
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'courses' ? styles.activeNav : ''}`}
            onClick={() => { setActiveTab("courses"); setSidebarOpen(false); }}
          >
            <BookOpen size={20} /> {t('courseManagement') || 'Course Management'}
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(o => !o)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <h2>{activeTab === 'dashboard' ? (t('dashboardOverview') || 'Overview') : activeTab === 'courses' ? (t('courseManagement') || 'Course Management') : (t('userManagement') || 'User Management')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Language Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                style={{ background: 'none', border: 'none', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowLangMenu(l => !l)}
              >
                <span>{currentLangMeta.flag}</span>
                <span>{lang.toUpperCase()}</span>
                <ChevronDown size={12} />
              </button>
              {showLangMenu && (
                <div className={styles.avatarDropdown} style={{ width: '150px' }}>
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      className={styles.avatarDropdownItem}
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    >
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className={styles.avatarDropdownWrapper}>
              <img 
                src={session?.user?.image || ""} 
                alt="" 
                className={styles.avatar} 
                onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                style={{ cursor: 'pointer' }}
              />
              {showAvatarDropdown && (
                <div className={styles.avatarDropdown}>
                  <div style={{ padding: '10px 16px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                    {session?.user?.name || "Admin User"}
                  </div>
                  <div className={styles.avatarDropdownDivider} />
                  <Link href="/" className={styles.avatarDropdownItem}>
                    <Globe size={14} /> {t('backToMain') || 'Back to Main Site'}
                  </Link>
                  <Link href="/profile" className={styles.avatarDropdownItem}>
                    <User size={14} /> {t('profile') || 'Profile'}
                  </Link>
                  <div className={styles.avatarDropdownDivider} />
                  <button className={styles.avatarDropdownItem} onClick={() => signOut()}>
                    <LogOut size={14} /> {t('signOut') || 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'dashboard' && (
            <>
              <div className={styles.dashboardGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><DollarSign size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.statLabel}>{t('totalRevenue') || 'Total Revenue'}</p>
                    <h3 className={styles.statValue}>${(stats?.totalSales || 0).toFixed(2)}</h3>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}><Users size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.statLabel}>{t('totalUsers') || 'Total Users'}</p>
                    <h3 className={styles.statValue}>{stats?.totalUsers || 0}</h3>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><BookOpen size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.statLabel}>{t('totalCourses') || 'Total Courses'}</p>
                    <h3 className={styles.statValue}>{stats?.totalCourses || 0}</h3>
                  </div>
                </div>
              </div>

              {/* CHARTS SECTION */}
              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <h3>{t('salesVsPayouts') || 'Sales vs Payouts (Last 6 Months)'}</h3>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="payout" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorPayout)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <h3>{t('salesByCategory') || 'Sales by Category'}</h3>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Second row of charts */}
              <div className={styles.chartGrid} style={{ marginTop: '24px' }}>
                <div className={styles.chartCard}>
                  <h3>{t('userGrowth') || 'User Growth & Retention'}</h3>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                        <Bar yAxisId="left" dataKey="newUsers" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="activeUsers" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <h3>{t('topCategories') || 'Top Performing Categories'}</h3>
                  <div style={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Courses" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'courses' && (
            <div className={styles.coursesSection}>
              <div className={styles.toolbar}>
                <input type="text" placeholder="Search courses..." className={styles.searchInput} />
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
                        <td data-label="ID">#{course.id}</td>
                        <td data-label="Title" style={{ fontWeight: 500 }}>{course.title}</td>
                        <td data-label="Author">{course.author}</td>
                        <td data-label="Category"><span className={styles.badge}>{course.category}</span></td>
                        <td data-label="Classcut">{course.isClasscutEnabled ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>Yes</span> : <span style={{ color: '#ef4444' }}>No</span>}</td>
                        <td data-label="Price">${course.price.toFixed(2)}</td>
                        <td data-label="Actions">
                          <button className={styles.actionBtn} style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteCourse(course.id)}>Delete</button>
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
                        <td data-label="ID">#{user.id}</td>
                        <td data-label="Name" style={{ fontWeight: 500 }}>{user.name}</td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Role">
                          {String(user.id) === currentUserId ? (
                            <span className={styles.badge} style={{
                              background: user.role === 'Admin' ? '#fef2f2' : user.role === 'Moderator' ? '#fdf4ff' : '#e0e7ff',
                              color: user.role === 'Admin' ? '#ef4444' : user.role === 'Moderator' ? '#c026d3' : '#4f46e5',
                              cursor: 'not-allowed',
                              opacity: 0.8
                            }} title="Không thể đổi role của chính bạn">
                              {user.role} (bạn)
                            </span>
                          ) : (
                            <select
                              className={styles.roleSelect}
                              value={user.role}
                              onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            >
                              <option value="Student">Student</option>
                              <option value="Instructor">Tutor</option>
                              <option value="Moderator">Moderator</option>
                              <option value="Admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td data-label="Joined">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td data-label="Actions">
                          {String(user.id) !== currentUserId && (
                            <>
                              {/* @ts-ignore */}
                              <button className={styles.actionBtn} style={{ background: user.isBanned ? '#10b981' : '#f59e0b', color: '#fff', borderColor: 'transparent', marginRight: '8px' }} onClick={() => handleToggleBan(user.id, user.isBanned || false)}>
                                {/* @ts-ignore */}
                                {user.isBanned ? 'Unban' : 'Ban'}
                              </button>
                              {(session as any)?.role === 'Admin' && (
                                <button className={styles.actionBtn} style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDeleteUser(user.id)}>Delete</button>
                              )}
                            </>
                          )}
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
    </div>
  );
}
