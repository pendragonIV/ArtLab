"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, ShoppingCart, Check, Clock, Play, Info } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';

type Lesson = { id: number; title: string; durationMinutes: number };
type Chapter = { id: number; title: string; orderIndex: number; price: number; lessons: Lesson[] };
type Course = {
  id: number;
  title: string;
  author: string;
  price: number;
  thumbnailUrl: string;
  chapters: Chapter[];
};

export default function ClasscutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<{ [courseId: number]: number[] }>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5149/api/courses/classcuts')
      .then(res => res.json())
      .then(data => { setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleChapter = (courseId: number, chapterId: number) => {
    setSelectedChapters(prev => {
      const current = prev[courseId] || [];
      return {
        ...prev,
        [courseId]: current.includes(chapterId)
          ? current.filter(id => id !== chapterId)
          : [...current, chapterId],
      };
    });
  };

  const calcTotal = (courseId: number, chapters: Chapter[]) => {
    const ids = selectedChapters[courseId] || [];
    return ids.reduce((acc, id) => acc + (chapters.find(c => c.id === id)?.price || 0), 0);
  };

  const handleAddToCart = async (courseId: number) => {
    if (!session) { signIn('google'); return; }
    const ids = selectedChapters[courseId] || [];
    if (!ids.length) return;

    setAddingCart(true);
    try {
      // @ts-ignore
      const token = session.backendToken;
      const res = await fetch('http://localhost:5149/api/cart/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(ids),
      });

      if (res.ok) {
        showToast(`✅ ${ids.length} chapter${ids.length > 1 ? 's' : ''} added to cart!`);
        setSelectedChapters(prev => ({ ...prev, [courseId]: [] }));
        setTimeout(() => router.push('/cart'), 1200);
      } else {
        const err = await res.text();
        showToast(`❌ ${err}`);
      }
    } catch {
      showToast('❌ An error occurred. Please try again.');
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <>
      <Header />
      {toast && <div className={styles.toast}>{toast}</div>}

      <main className={styles.main}>
        {/* ─── HERO ─────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={styles.heroContent}>
            <div className={styles.heroPill}>
              <Scissors size={14} />
              ArtLab Classcut
            </div>
            <h1 className={styles.heroTitle}>Pay Only for What You Need</h1>
            <p className={styles.heroSub}>
              Classcut lets you buy individual chapters from full courses — perfect for learning
              specific skills without committing to the entire program.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><strong>{courses.length}+</strong> Available Courses</div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><strong>Save up to 80%</strong> vs. full price</div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}><strong>Instant</strong> access after purchase</div>
            </div>
          </div>
        </div>

        {/* ─── HOW IT WORKS ─────────────────────────────── */}
        <div className={styles.howItWorks}>
          <div className={styles.howStep}>
            <div className={styles.howNum}>1</div>
            <span>Choose a course below</span>
          </div>
          <div className={styles.howArrow}>→</div>
          <div className={styles.howStep}>
            <div className={styles.howNum}>2</div>
            <span>Select the chapters you want</span>
          </div>
          <div className={styles.howArrow}>→</div>
          <div className={styles.howStep}>
            <div className={styles.howNum}>3</div>
            <span>Add to cart & checkout</span>
          </div>
        </div>

        {/* ─── COURSE LIST ──────────────────────────────── */}
        <div className={styles.listWrapper}>
          {courses.length === 0 ? (
            <div className={styles.empty}>
              <Scissors size={40} strokeWidth={1} />
              <h2>No Classcut Courses Available</h2>
              <p>Check back soon — we're adding more content regularly.</p>
              <Link href="/series" className={styles.emptyBtn}>Browse All Courses</Link>
            </div>
          ) : (
            courses.map(course => {
              const selectedIds = selectedChapters[course.id] || [];
              const total = calcTotal(course.id, course.chapters);
              const totalLessons = course.chapters.reduce((a, c) => a + (c.lessons?.length || 0), 0);

              return (
                <div key={course.id} className={styles.courseCard}>
                  {/* Left panel */}
                  <div className={styles.cardLeft}>
                    <div className={styles.cardThumb}>
                      <img src={course.thumbnailUrl} alt={course.title} />
                      <div className={styles.thumbOverlay}>
                        <Play size={28} color="#fff" />
                      </div>
                    </div>
                    <div className={styles.cardMeta}>
                      <h2 className={styles.cardTitle}>{course.title}</h2>
                      <p className={styles.cardAuthor}>{course.author}</p>
                      <div className={styles.cardMetaRow}>
                        <span><Clock size={12} /> {totalLessons} lessons</span>
                        <span>{course.chapters.length} chapters</span>
                      </div>
                      <div className={styles.fullPriceLine}>
                        Full course: <strong>${course.price.toFixed(2)}</strong>
                      </div>
                      <Link href={`/course/${course.id}`} className={styles.viewFullBtn}>
                        View Full Course →
                      </Link>
                    </div>
                  </div>

                  {/* Right panel: chapter selector */}
                  <div className={styles.cardRight}>
                    <div className={styles.chaptersHeader}>
                      <h3 className={styles.chaptersTitle}>Select Chapters</h3>
                      {selectedIds.length > 0 && (
                        <button
                          className={styles.clearBtn}
                          onClick={() => setSelectedChapters(prev => ({ ...prev, [course.id]: [] }))}
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className={styles.chaptersList}>
                      {course.chapters.length === 0 ? (
                        <p className={styles.noChapters}>No chapters available for Classcut.</p>
                      ) : (
                        course.chapters.map(chapter => {
                          const isSelected = selectedIds.includes(chapter.id);
                          return (
                            <div
                              key={chapter.id}
                              className={`${styles.chapterItem} ${isSelected ? styles.chapterSelected : ''}`}
                              onClick={() => toggleChapter(course.id, chapter.id)}
                            >
                              <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}>
                                {isSelected && <Check size={11} strokeWidth={3} />}
                              </div>
                              <div className={styles.chapterInfo}>
                                <div className={styles.chapterName}>
                                  <span className={styles.chapterIdx}>{chapter.orderIndex}.</span>
                                  {chapter.title}
                                </div>
                                <div className={styles.chapterLessons}>
                                  {chapter.lessons?.length || 0} lessons
                                </div>
                              </div>
                              <div className={styles.chapterPrice}>${chapter.price.toFixed(2)}</div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer sticky */}
                    <div className={styles.chapterFooter}>
                      <div className={styles.footerLeft}>
                        {selectedIds.length > 0 ? (
                          <>
                            <span className={styles.selectedCount}>{selectedIds.length} chapter{selectedIds.length > 1 ? 's' : ''} selected</span>
                            <span className={styles.totalPrice}>${total.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className={styles.footerHint}>
                            <Info size={13} /> Select chapters above
                          </span>
                        )}
                      </div>
                      <button
                        className={`${styles.addCartBtn} ${selectedIds.length === 0 ? styles.addCartDisabled : ''}`}
                        disabled={selectedIds.length === 0 || addingCart}
                        onClick={() => handleAddToCart(course.id)}
                      >
                        <ShoppingCart size={15} />
                        {addingCart ? 'Adding…' : `Add to Cart`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
