"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  User, BookOpen, Calendar, ArrowLeft,
  Star, ExternalLink,
} from "lucide-react";
import styles from "./page.module.css";

interface PublicProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  role: string;
  headline: string | null;
  bio: string | null;
  createdAt: string;
  totalCourses: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_LABEL: Record<string, string> = {
  Admin: "Admin",
  Instructor: "Giảng viên",
  Student: "Học viên",
};

const ROLE_COLOR: Record<string, string> = {
  Admin: "#ef4444",
  Instructor: "#f59e0b",
  Student: "#6366f1",
};

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile =
    // @ts-ignore
    session?.user && String(session?.backendUserId) === userId;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5149"}/api/profile/${userId}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setProfile(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <User size={56} className={styles.errorIcon} />
          <h2>Không tìm thấy người dùng</h2>
          <p>Tài khoản này có thể không tồn tại hoặc đã bị xoá.</p>
          <Link href="/" className={styles.backHomeBtn}>← Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(profile.createdAt).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
  });

  const avatarColors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  ];
  const avatarBg = avatarColors[profile.username.charCodeAt(0) % avatarColors.length];

  return (
    <div className={styles.page}>
      {/* Back button */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => history.back()}>
          <ArrowLeft size={16} />
          Quay lại
        </button>
        {isOwnProfile && (
          <Link href="/profile" className={styles.editBtn}>
            Chỉnh sửa hồ sơ
          </Link>
        )}
      </div>

      <div className={styles.container}>
        {/* Hero section */}
        <div className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            {/* Avatar */}
            <div className={styles.avatarWrapper}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback} style={{ background: avatarBg }}>
                  {getInitials(profile.username)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.heroInfo}>
              <div className={styles.nameRow}>
                <h1 className={styles.username}>{profile.username}</h1>
                <span
                  className={styles.roleBadge}
                  style={{ background: `${ROLE_COLOR[profile.role] || "#6366f1"}22`, color: ROLE_COLOR[profile.role] || "#6366f1", borderColor: `${ROLE_COLOR[profile.role] || "#6366f1"}44` }}
                >
                  {profile.role === "Instructor" && <Star size={11} />}
                  {ROLE_LABEL[profile.role] || profile.role}
                </span>
              </div>

              {profile.headline && (
                <p className={styles.headline}>{profile.headline}</p>
              )}

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <Calendar size={13} />
                  Tham gia {joinedDate}
                </span>
                <span className={styles.metaItem}>
                  <BookOpen size={13} />
                  {profile.totalCourses} khóa học
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Bio */}
          {profile.bio && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <ExternalLink size={16} />
                Giới thiệu
              </h2>
              <p className={styles.bioText}>{profile.bio}</p>
            </section>
          )}

          {/* Stats */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Star size={16} />
              Thống kê
            </h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{profile.totalCourses}</span>
                <span className={styles.statLabel}>Khóa học tham gia</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>
                  {new Date(profile.createdAt).toLocaleDateString("vi-VN", { year: "numeric" })}
                </span>
                <span className={styles.statLabel}>Năm tham gia</span>
              </div>
            </div>
          </section>

          {/* Empty state if no content */}
          {!profile.bio && (
            <div className={styles.emptyContent}>
              <User size={40} className={styles.emptyIcon} />
              <p>Người dùng chưa thêm thông tin giới thiệu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
