"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import styles from "./page.module.css";
import { Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Course = {
  id: number;
  title: string;
  author: string;
  thumbnailUrl: string;
};

export default function MyCoursesPage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      window.location.href = "/"; // redirect home if not logged in
      return;
    }

    if (session) {
      fetchMyCourses();
    }
  }, [session, status]);

  const fetchMyCourses = async () => {
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/mycourses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.headerArea}>
          <h1 className={styles.title}>{t('myClassroomTitle')}</h1>
          <p className={styles.subtitle}>{t('welcomeBack')}, {session?.user?.name?.split(' ')[0]}! {t('pickUpWhereLeftOff')}</p>
        </div>

        {status === "loading" || loading ? (
          <div className={styles.loadingSpinner}>{t('loadingCourses')}</div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>{t('noCoursesTitle')}</h2>
            <p>{t('noCoursesDesc')}</p>
            <Link href="/" className={styles.browseBtn}>{t('browseCoursesBtn')}</Link>
          </div>
        ) : (
          <div className={styles.courseGrid}>
            {courses.map(course => (
              <div key={course.id} className={styles.courseCard}>
                <div className={styles.imageWrapper}>
                  <img src={course.thumbnailUrl} alt={course.title} className={styles.thumbnail} />
                  <div className={styles.playOverlay}>
                    <div className={styles.playButton}><Play fill="white" size={24} /></div>
                  </div>
                </div>
                <div className={styles.courseInfo}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseAuthor}>{course.author}</p>
                  
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '0%' }}></div>
                    </div>
                    <span className={styles.progressText}>0% {t('completeText')}</span>
                  </div>
                  
                  <Link href={`/learn/${course.id}`} className={styles.continueBtn} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                    {t('watchNow')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
