import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import AddToCartButton from "@/components/AddToCartButton";
import Link from "next/link";
import {
  RotateCcw, CalendarClock, Tag, MonitorPlay, BarChart2,
  Globe, Subtitles, Package, Share2
} from "lucide-react";
import CurriculumGrid from "./CurriculumGrid";
import CourseCard from "@/components/CourseCard";

type Lesson = {
  id: number;
  title: string;
  durationSeconds: number;
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
  level?: string;
  audioLanguage?: string;
  subtitleLanguage?: string;
  includesMaterials?: boolean;
  chapters: Chapter[];
  instructorProfile?: {
    headline: string;
    bio: string;
    youtubeUrl?: string;
    twitterUrl?: string;
    portfolioImagesJson?: string;
  };
};

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`http://localhost:5149/api/courses/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();

  const course: Course = await res.json();
  const firstLesson = course.chapters?.[0]?.lessons?.[0];
  const totalLessons = course.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
  const discountPct = course.originalPrice > course.price
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;
  // Check enrollment status
  let isEnrolled = false;
  try {
    const session = await getServerSession();
    if (session?.user?.email) {
      // Check via backend if enrolled — pass header without token (public endpoint check)
      const enrollRes = await fetch(
        `http://localhost:5149/api/courses/${id}/is-enrolled?email=${encodeURIComponent(session.user.email)}`,
        { cache: 'no-store' }
      );
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        isEnrolled = enrollData.isEnrolled === true;
      }
    }
  } catch {}
  const recRes = await fetch(`http://localhost:5149/api/courses`, { cache: 'no-store' });
  let recommendedCourses: Course[] = [];
  if (recRes.ok) {
    const allCourses: Course[] = await recRes.json();
    recommendedCourses = allCourses.filter(c => c.id !== course.id).slice(0, 3);
  }

  // Tags derived from category
  const tags = course.category
    ? course.category.split(',').map(t => t.trim()).filter(Boolean)
    : ['Art', 'Design'];

  return (
    <>
      <Header />
      <main className={styles.main}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          {/* Full-width artwork background */}
          <div className={styles.heroArtwork}>
            <img src={course.thumbnailUrl} alt="" className={styles.heroArtworkImg} />
            <div className={styles.heroArtworkOverlay} />
          </div>

          <div className={styles.heroContent}>
            {/* Breadcrumb */}
            <div className={styles.heroBreadcrumb}>
              <span>Illustration</span>
              <span className={styles.breadcrumbSep}>›</span>
              <span>{course.category}</span>
            </div>

            {/* Title */}
            <h1 className={styles.heroTitle}>
              {course.title}
              <button className={styles.shareBtn} aria-label="Share">
                <Share2 size={16} />
              </button>
            </h1>

            {/* Instructor */}
            <p className={styles.heroInstructor}>
              <Link href={`/instructor/${encodeURIComponent(course.author)}`} className={styles.instructorLink}>
                {course.author}
              </Link>
            </p>

            {/* 3 feature icons */}
            <div className={styles.heroFeatureIcons}>
              <div className={styles.heroFeatureItem}>
                <div className={styles.heroFeatureCircle}><RotateCcw size={22} /></div>
                <span>Unlimited</span>
              </div>
              <div className={styles.heroFeatureItem}>
                <div className={styles.heroFeatureCircle}><CalendarClock size={22} /></div>
                <span>Pre-order</span>
              </div>
              <div className={styles.heroFeatureItem}>
                <div className={styles.heroFeatureCircle}><Tag size={22} /></div>
                <span>Discount<br />Coupons</span>
              </div>
            </div>

            {/* Tags */}
            <div className={styles.heroTags}>
              {tags.map(tag => (
                <span key={tag} className={styles.heroTag}>{tag}</span>
              ))}
            </div>

            {/* Price + CTA */}
            <div className={styles.heroPriceRow}>
              {discountPct > 0 && (
                <span className={styles.heroOriginalPrice}>USD {course.originalPrice.toFixed(2)}</span>
              )}
              {discountPct > 0 && (
                <span className={styles.heroDiscountBadge}>Up to {discountPct}% off</span>
              )}
              <span className={styles.heroPrice}>USD {course.price.toFixed(2)} ~</span>
            </div>

            <AddToCartButton courseId={course.id} className={styles.earlyBirdBtn} label="Be an Early Bird" />
          </div>
        </section>

        {/* ── STICKY PRICE BAR (shown after scroll) ────────────────────── */}
        <div className={styles.stickyPriceBar}>
          <div className={styles.stickyPriceInner}>
            <div className={styles.stickyPriceInfo}>
              {discountPct > 0 && (
                <span className={styles.stickyOriginalPrice}>USD {course.originalPrice.toFixed(2)}</span>
              )}
              {discountPct > 0 && (
                <span className={styles.stickyDiscountBadge}>Up to {discountPct}% off</span>
              )}
              <span className={styles.stickyPrice}>USD {course.price.toFixed(2)} ~</span>
            </div>
            <AddToCartButton courseId={course.id} className={styles.earlyBirdBtnSmall} label="Be an Early Bird" />
          </div>
        </div>

        {/* ── CLASS DETAILS ─────────────────────────────────────────────── */}
        <section className={styles.classDetailsBand}>
          <div className={styles.classDetailsInner}>
            {/* Left: course info list */}
            <div className={styles.classInfoCol}>
              <h2 className={styles.classDetailsTitle}>Class Details</h2>
              <ul className={styles.classInfoList}>
                <li className={styles.classInfoItem}>
                  <CalendarClock size={16} className={styles.classInfoIcon} />
                  <span>
                    <strong>Class Opens in 30days</strong>
                    <span className={styles.classInfoSub}>&nbsp;&nbsp;07/05/2026 19:00 (UTC-7)</span>
                  </span>
                </li>
                <li className={styles.classInfoItem}>
                  <BarChart2 size={16} className={styles.classInfoIcon} />
                  <span>{course.level || 'Basic~Advanced'}</span>
                </li>
                <li className={styles.classInfoItem}>
                  <MonitorPlay size={16} className={styles.classInfoIcon} />
                  <span>Total {totalLessons} videos</span>
                </li>
                <li className={styles.classInfoItem}>
                  <Globe size={16} className={styles.classInfoIcon} />
                  <span>{course.audioLanguage || 'English'}</span>
                </li>
                <li className={styles.classInfoItem}>
                  <Subtitles size={16} className={styles.classInfoIcon} />
                  <span>{course.subtitleLanguage || 'English, Vietnamese [Auto]'}</span>
                </li>
                {course.includesMaterials && (
                  <li className={styles.classInfoItem}>
                    <Package size={16} className={styles.classInfoIcon} />
                    <span>Class materials included</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Divider */}
            <div className={styles.classDetailsDivider} />

            {/* Right: pricing card */}
            <div className={styles.pricingCard}>
              <div className={styles.pricingTop}>
                {discountPct > 0 && (
                  <div className={styles.pricingDiscountLine}>
                    <span className={styles.pricingDiscountBadge}>Up to {discountPct}% off</span>
                    <span className={styles.pricingOriginal}>USD {course.originalPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.pricingMainRow}>
                  <span className={styles.pricingMain}>USD {course.price.toFixed(2)} ~</span>
                  <span className={styles.pricingApprox}>approx. price by currency ⓘ</span>
                </div>
              </div>
              <div className={styles.couponList}>
                <div className={styles.couponRow}>
                  <span>Discount Coupons</span>
                  <span className={styles.couponVal}>Max USD 10.00 <span className={styles.couponArrow}>›</span></span>
                </div>
                <div className={styles.couponRow}>
                  <span>Welcome Coupons</span>
                  <span className={styles.couponVal}>Max USD 20.00 <span className={styles.couponArrow}>›</span></span>
                </div>
              </div>
              <p className={styles.pricingNote}>* Please carefully read the Important Notice of each item at the bottom.</p>
            </div>
          </div>
        </section>

        {/* ── STICKY NAVIGATION ─────────────────────────────────────────── */}
        <nav className={styles.stickyNav}>
          <div className={styles.stickyNavInner}>
            <a href="#intro" className={`${styles.navLink} ${styles.navLinkActive}`}>Intro</a>
            <a href="#highlights" className={styles.navLink}>Highlights</a>
            <a href="#instructor" className={styles.navLink}>Instructor</a>
            <a href="#curriculum" className={styles.navLink}>Curriculum</a>
            <a href="#recommended" className={styles.navLink}>Recommended Classes</a>
          </div>
        </nav>

        {/* ── INTRO BAND (purple gradient) ──────────────────────────────── */}
        <section id="intro" className={styles.introBand}>
          <div className={styles.introBandInner}>
            <div className={styles.introIconGroup}>
              <span className={styles.introIconBubble} style={{ background: '#4f46e5' }}>字</span>
              <span className={styles.introIconBubble} style={{ background: '#0ea5e9' }}>🌐</span>
              <span className={styles.introIconBubble} style={{ background: '#f59e0b' }}>A</span>
            </div>
            <h2 className={styles.introHeadline}>
              Now in Your Language, Only on ArtLab!<br />
              <span className={styles.introHeadlineSub}>Learn from Top Creative Experts Worldwide</span>
            </h2>
            <div className={styles.introFeatures}>
              <div className={styles.introFeatureBtn}>↗ Step-by-Step Figure Training</div>
              <div className={styles.introFeatureBtn}>◈ Structured Anatomy Breakdown</div>
              <div className={styles.introFeatureBtn}>✏ Dynamic Pose Drawing</div>
            </div>
          </div>
        </section>

        {/* ── ENCYCLOPEDIA BAND (light bg) ──────────────────────────────── */}
        <section id="highlights" className={styles.encyclopediaBand}>
          <div className={styles.encyclopediaBandInner}>
            <h2 className={styles.encyclopediaTitle}>encyclopedia<span className={styles.encyclopediaDot}>■</span></h2>
            <div className={styles.encyclopediaDivider} />
            <p className={styles.encyclopediaDesc}>
              Encyclopedia at ArtLab refers to a carefully crafted, comprehensive course format,<br />
              offering an expansive curriculum and curated materials to provide you with a complete guide for all skill levels.
            </p>
            <div className={styles.encyclopediaDivider} />
            <div className={styles.encyclopediaCards}>
              <div className={styles.encyclopediaCard}>
                <div className={styles.encyclopediaCardIcon}>🎨</div>
                <p className={styles.encyclopediaCardSub}>From Fundamentals to Practice</p>
                <p className={styles.encyclopediaCardTitle}>All-in-One Figure Drawing</p>
              </div>
              <div className={styles.encyclopediaCard}>
                <div className={styles.encyclopediaCardIcon}>📋</div>
                <p className={styles.encyclopediaCardSub}>A Step-by-Step</p>
                <p className={styles.encyclopediaCardTitle}>{totalLessons}-Chapter Curriculum</p>
              </div>
              <div className={styles.encyclopediaCard}>
                <div className={styles.encyclopediaCardIcon}>▶</div>
                <p className={styles.encyclopediaCardSub}>The Complete Drawing Solution</p>
                <p className={styles.encyclopediaCardTitle}>Covering Even the Most Challenging Parts</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── DARK ABOUT BAND ───────────────────────────────────────────── */}
        <section className={styles.darkAboutBand}>
          <div className={styles.darkAboutInner}>
            <div className={styles.darkAboutLeft}>
              <h2 className={styles.darkAboutTitle}>
                {course.author}&apos;s Extended Course, Completed in Just {totalLessons} Days
              </h2>
            </div>
            <div className={styles.darkAboutRight}>
              <p className={styles.darkAboutDesc}>
                An expanded course that delves deeper into even the most challenging aspects with greater enjoyment and precision!{' '}
                <strong>Learn the most difficult elements of drawing,</strong> such as anatomy, geometrization, and dynamic poses,
                step by step in an easy-to-follow format. The definitive course that will transform your creative quality,
                allowing you to draw naturally from any 360-degree angle.
              </p>
            </div>
          </div>
        </section>

        {/* ── INSTRUCTOR ────────────────────────────────────────────────── */}
        <section id="instructor" className={styles.instructorBand}>
          <div className={styles.bandInner}>
            <h2 className={styles.sectionTitle}>Instructor</h2>
            <div className={styles.instructorCard}>
              <div className={styles.instructorCardHeader}>
                <div className={styles.instructorAvatar}>
                  {course.author.charAt(0)}
                </div>
                <div>
                  <h3 className={styles.instructorNameLarge}>{course.author}</h3>
                  <p className={styles.instructorTagline}>{course.instructorProfile?.headline || 'Professional Instructor'}</p>
                  <div className={styles.instructorLinks}>
                    {course.instructorProfile?.youtubeUrl && (
                      <a href={course.instructorProfile.youtubeUrl} target="_blank" rel="noopener noreferrer" className={styles.instructorSocialLink}>▶ YouTube</a>
                    )}
                    {course.instructorProfile?.twitterUrl && (
                      <a href={course.instructorProfile.twitterUrl} target="_blank" rel="noopener noreferrer" className={styles.instructorSocialLink}>@ Twitter</a>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.instructorBio}>
                {course.instructorProfile?.bio ? (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{course.instructorProfile.bio}</p>
                ) : (
                  <p>Hello! I am {course.author}, an industry professional passionate about sharing my knowledge with aspiring artists worldwide. With years of experience in the field, I will guide you through every step of the journey.</p>
                )}
              </div>
              {course.instructorProfile?.portfolioImagesJson &&
                JSON.parse(course.instructorProfile.portfolioImagesJson).length > 0 && (
                <div className={styles.portfolioStrip}>
                  {JSON.parse(course.instructorProfile.portfolioImagesJson).map((imgUrl: string, idx: number) => (
                    <img key={idx} src={imgUrl} alt="Portfolio" className={styles.portfolioImg} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CURRICULUM ────────────────────────────────────────────────── */}
        <section id="curriculum" className={styles.curriculumBand}>
          <div className={styles.bandInner}>
            <h2 className={styles.sectionTitle}>Course Curriculum</h2>
            <CurriculumGrid chapters={course.chapters} courseId={course.id} isEnrolled={isEnrolled} />
          </div>
        </section>

        {/* ── RECOMMENDED ───────────────────────────────────────────────── */}
        <section id="recommended" className={styles.recommendedBand}>
          <div className={styles.bandInner}>
            <h2 className={styles.sectionTitle}>Recommended Classes</h2>
            <div className={styles.recommendedGrid}>
              {recommendedCourses.map(rc => (
                <CourseCard
                  key={rc.id}
                  id={rc.id}
                  title={rc.title}
                  author={rc.author}
                  category={rc.category}
                  price={rc.price}
                  originalPrice={rc.originalPrice}
                  thumbnailUrl={rc.thumbnailUrl}
                  isNew={rc.isNew}
                  isTrending={rc.isTrending}
                />
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── STICKY BOTTOM CTA ─────────────────────────────────────────── */}
      <div className={styles.stickyBottomCTA}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaLeft}>
            {discountPct > 0 && (
              <>
                <span className={styles.ctaOriginalPrice}>USD {course.originalPrice.toFixed(2)}</span>
                <span className={styles.ctaDiscountBadge}>Up to {discountPct}% off</span>
              </>
            )}
            <span className={styles.ctaPrice}>USD {course.price.toFixed(2)} ~</span>
          </div>
          <AddToCartButton courseId={course.id} className={styles.ctaEarlyBirdBtn} label="Be an Early Bird" />
        </div>
      </div>

      <Footer />
    </>
  );
}
