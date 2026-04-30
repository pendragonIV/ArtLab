import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";

type Lesson = {
  id: number;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
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
  category: string;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  isNew: boolean;
  isTrending: boolean;
  chapters: Chapter[];
};

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`http://localhost:5149/api/courses/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();

  const course: Course = await res.json();
  const firstLesson = course.chapters?.[0]?.lessons?.[0];
  const totalLessons = course.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
  const totalMinutes = course.chapters?.flatMap(ch => ch.lessons).reduce((sum, l) => sum + l.durationMinutes, 0) ?? 0;

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.coverImageWrapper}>
            <img src={course.thumbnailUrl} alt={course.title} className={styles.coverImage} />
          </div>
          <div className={styles.figcaption}>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
              {course.title}
            </h1>
            <p style={{ fontSize: '24px', color: '#aaa', textAlign: 'center' }}>
              Instructor:{' '}
              <a href={`/instructor/${encodeURIComponent(course.author)}`}
                style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                {course.author}
              </a>
            </p>
          </div>
          <div className={styles.earlyBirdBanner}>
            <button className={styles.earlyBirdBtn}>Be an Early Bird</button>
          </div>
        </section>

        {/* SUMMARY */}
        <section className={styles.summarySection}>
          <div className={styles.summaryContainer}>
            <div className={styles.detailsBox}>
              <h2 className={styles.detailsTitle}>Class Details</h2>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>• {totalLessons} Video Lessons (Full HD)</div>
                <div className={styles.detailItem}>• {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m total content</div>
                <div className={styles.detailItem}>• Lifetime Access to Updates</div>
                <div className={styles.detailItem}>• English Subtitles Available</div>
                <div className={styles.detailItem}>• Exclusive Discord Community Access</div>
              </div>
            </div>
            <div className={styles.verticalDivider}></div>
            <div className={styles.priceBox}>
              <div className={styles.priceHeader}>
                <span className={styles.priceLabel}>Early Bird Special Price</span>
                <span className={styles.priceValue}>${course.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <AddToCartButton courseId={course.id} className={styles.actionBtn} />
                {firstLesson && (
                  <Link
                    href={`/learn/${course.id}/${firstLesson.id}`}
                    style={{
                      display: 'block', textAlign: 'center', padding: '14px 20px',
                      background: '#27272a', color: '#fff', borderRadius: '8px',
                      textDecoration: 'none', fontWeight: 600, fontSize: '15px'
                    }}
                  >
                    ▶ Preview Free Lessons
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CURRICULUM */}
        <article className={styles.article}>
          <div className={styles.articleContainer}>
            <h2 className={styles.articleTitle}>Portfolio Gallery</h2>
            <div className={styles.curriculumGrid}>
              {[...Array(16)].map((_, i) => (
                <div key={i} className={styles.curriculumCircle}></div>
              ))}
            </div>

            <div style={{ padding: '40px 0' }}>
              <div className={styles.courseDescription}>
                <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>About This Course</h2>
                <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#555', marginBottom: '40px' }}>
                  In this comprehensive course, {course.author} will take you through the entire workflow
                  from basic concepts to advanced techniques. Whether you are a beginner looking to build
                  a strong foundation or an intermediate artist aiming to refine your skills, this course
                  provides step-by-step guidance, practical assignments, and industry-standard workflows.
                </p>

                <div className={styles.curriculumSection}>
                  <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Curriculum</h2>
                  {course.chapters && course.chapters.length > 0 ? (
                    <div className={styles.chapterList}>
                      {course.chapters.map(chapter => (
                        <div key={chapter.id} className={styles.chapterCard}>
                          <h3 className={styles.chapterTitle}>
                            Part {chapter.orderIndex}: {chapter.title}
                          </h3>
                          <div className={styles.lessonList}>
                            {chapter.lessons.map(lesson => (
                              <Link
                                key={lesson.id}
                                href={`/learn/${course.id}/${lesson.id}`}
                                className={styles.lessonRow}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <div className={styles.lessonInfo}>
                                  <span className={styles.lessonIcon}>▶</span>
                                  <span className={styles.lessonTitle}>{lesson.title}</span>
                                </div>
                                <div className={styles.lessonMeta}>
                                  {lesson.isFreePreview && <span className={styles.freeBadge}>Preview</span>}
                                  <span className={styles.lessonDuration}>{lesson.durationMinutes} min</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Curriculum is being updated.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
