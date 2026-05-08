"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import styles from "./page.module.css";

type Lesson = {
  id: number;
  title: string;
  durationSeconds: number;
  isFreePreview: boolean;
  videoUrl: string;
  orderIndex: number;
};

type Chapter = {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
};

type Course = {
  id: number;
  title: string;
  author: string;
  chapters: Chapter[];
};

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/";
      return;
    }

    if (session) {
      fetchCourseData();
    }
  }, [session, status]);

  const fetchCourseData = async () => {
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch(`\${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/mycourses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        // Set first lesson active
        if (data.chapters && data.chapters.length > 0 && data.chapters[0].lessons.length > 0) {
          setActiveLesson(data.chapters[0].lessons[0]);
        }
      } else if (res.status === 403) {
        setError("You do not have access to this course.");
      } else {
        setError("Failed to load course.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fmtDuration = (seconds: number | null | undefined) => {
    const s = Math.max(0, Math.floor(seconds ?? 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  if (status === "loading" || loading) {
    return <div className={styles.loadingScreen}>Loading player...</div>;
  }

  if (error || !course) {
    return (
      <div className={styles.errorScreen}>
        <h2>{error || "Course not found"}</h2>
        <Link href="/my-courses" className={styles.backBtn}>Back to My Courses</Link>
      </div>
    );
  }

  return (
    <div className={styles.playerLayout}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/my-courses" className={styles.backLink}>
            <ArrowLeft size={20} /> My Courses
          </Link>
          <h2 className={styles.courseTitle}>{course.title}</h2>
          <p className={styles.courseAuthor}>{course.author}</p>
        </div>
        
        <div className={styles.curriculumList}>
          {course.chapters.map(chapter => (
            <div key={chapter.id} className={styles.chapterGroup}>
              <h3 className={styles.chapterTitle}>Part {chapter.orderIndex}: {chapter.title}</h3>
              <div className={styles.lessonList}>
                {chapter.lessons.map(lesson => (
                  <button 
                    key={lesson.id} 
                    className={`${styles.lessonItem} ${activeLesson?.id === lesson.id ? styles.activeLesson : ''}`}
                    onClick={() => setActiveLesson(lesson)}
                  >
                    <PlayCircle size={16} className={styles.playIcon} />
                    <span className={styles.lessonTitleText}>{lesson.title}</span>
                    <span className={styles.durationText}>{fmtDuration(lesson.durationSeconds)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.videoWrapper}>
          {/* Fake Video Player for demo purposes */}
          <div className={styles.fakeVideoPlayer}>
            {activeLesson ? (
              <div className={styles.playerPlaceholder}>
                <PlayCircle size={64} className={styles.bigPlayIcon} />
                <h2>{activeLesson.title}</h2>
                <p>Mock Video Player. In a real app, the videoUrl would be loaded here.</p>
              </div>
            ) : (
              <p>Select a lesson to start learning</p>
            )}
          </div>
        </div>
        
        {activeLesson && (
          <div className={styles.lessonDetails}>
            <h1 className={styles.activeLessonHeading}>{activeLesson.title}</h1>
            <div className={styles.tabsContainer}>
              <button className={styles.tabActive}>Overview</button>
              <button className={styles.tab}>Q&A</button>
              <button className={styles.tab}>Resources</button>
            </div>
            <div className={styles.tabContent}>
              <p>This is the overview for <strong>{activeLesson.title}</strong>.</p>
              <p>In this lesson, you will learn the core concepts required to master the workflow. Make sure to download the resources attached to this lesson and follow along.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
