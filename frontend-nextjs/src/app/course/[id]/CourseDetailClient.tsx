"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import AddToCartButton from '@/components/AddToCartButton';
import Link from 'next/link';
import {
  RotateCcw, CalendarClock, Tag, MonitorPlay, BarChart2,
  Globe, Subtitles, Package, Share2
} from 'lucide-react';
import styles from './page.module.css';

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

export default function CourseDetailClient({
  course,
  totalLessons,
  discountPct,
  isEnrolled,
  tags,
  recommendedCourses,
  CurriculumGrid,
  CourseCard,
}: {
  course: Course;
  totalLessons: number;
  discountPct: number;
  isEnrolled: boolean;
  tags: string[];
  recommendedCourses: Course[];
  CurriculumGrid: React.ComponentType<{ chapters: Chapter[]; courseId: number; isEnrolled?: boolean }>;
  CourseCard: React.ComponentType<any>;
}) {
  const { t } = useLanguage();

  return (
    <main className={styles.main}>

      {/* ── HERO */}
      <section className={styles.hero}>
        <div className={styles.heroArtwork}>
          <img src={course.thumbnailUrl} alt="" className={styles.heroArtworkImg} />
          <div className={styles.heroArtworkOverlay} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBreadcrumb}>
            <span>{t('courseIllustration')}</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span>{course.category}</span>
          </div>

          <h1 className={styles.heroTitle}>
            {course.title}
            <button className={styles.shareBtn} aria-label={t('courseShare')}>
              <Share2 size={16} />
            </button>
          </h1>

          <p className={styles.heroInstructor}>
            <Link href={`/instructor/${encodeURIComponent(course.author)}`} className={styles.instructorLink}>
              {course.author}
            </Link>
          </p>

          <div className={styles.heroFeatureIcons}>
            <div className={styles.heroFeatureItem}>
              <div className={styles.heroFeatureCircle}><RotateCcw size={22} /></div>
              <span>{t('courseUnlimited')}</span>
            </div>
            <div className={styles.heroFeatureItem}>
              <div className={styles.heroFeatureCircle}><CalendarClock size={22} /></div>
              <span>{t('coursePreOrder')}</span>
            </div>
            <div className={styles.heroFeatureItem}>
              <div className={styles.heroFeatureCircle}><Tag size={22} /></div>
              <span>{t('courseDiscountCoupons')}</span>
            </div>
          </div>

          <div className={styles.heroTags}>
            {tags.map(tag => (
              <span key={tag} className={styles.heroTag}>{tag}</span>
            ))}
          </div>

          <div className={styles.heroPriceRow}>
            {discountPct > 0 && (
              <span className={styles.heroOriginalPrice}>USD {course.originalPrice.toFixed(2)}</span>
            )}
            {discountPct > 0 && (
              <span className={styles.heroDiscountBadge}>{t('courseUpTo')} {discountPct}{t('courseOff')}</span>
            )}
            <span className={styles.heroPrice}>USD {course.price.toFixed(2)} ~</span>
          </div>

          <AddToCartButton courseId={course.id} className={styles.earlyBirdBtn} label={t('courseBeEarlyBird')} />
        </div>
      </section>

      {/* ── STICKY PRICE BAR */}
      <div className={styles.stickyPriceBar}>
        <div className={styles.stickyPriceInner}>
          <div className={styles.stickyPriceInfo}>
            {discountPct > 0 && (
              <span className={styles.stickyOriginalPrice}>USD {course.originalPrice.toFixed(2)}</span>
            )}
            {discountPct > 0 && (
              <span className={styles.stickyDiscountBadge}>{t('courseUpTo')} {discountPct}{t('courseOff')}</span>
            )}
            <span className={styles.stickyPrice}>USD {course.price.toFixed(2)} ~</span>
          </div>
          <AddToCartButton courseId={course.id} className={styles.earlyBirdBtnSmall} label={t('courseBeEarlyBird')} />
        </div>
      </div>

      {/* ── CLASS DETAILS */}
      <section className={styles.classDetailsBand}>
        <div className={styles.classDetailsInner}>
          <div className={styles.classInfoCol}>
            <h2 className={styles.classDetailsTitle}>{t('courseClassDetails')}</h2>
            <ul className={styles.classInfoList}>
              <li className={styles.classInfoItem}>
                <CalendarClock size={16} className={styles.classInfoIcon} />
                <span>
                  <strong>{t('courseClassOpens')}</strong>
                  <span className={styles.classInfoSub}>&nbsp;&nbsp;{t('courseLaunchDate')}</span>
                </span>
              </li>
              <li className={styles.classInfoItem}>
                <BarChart2 size={16} className={styles.classInfoIcon} />
                <span>{course.level === 'Basic~Advanced' || !course.level ? t('courseBasicAdvanced') : course.level}</span>
              </li>
              <li className={styles.classInfoItem}>
                <MonitorPlay size={16} className={styles.classInfoIcon} />
                <span>{t('courseTotalVideos').replace('{n}', String(totalLessons))}</span>
              </li>
              <li className={styles.classInfoItem}>
                <Globe size={16} className={styles.classInfoIcon} />
                <span>{course.audioLanguage === 'English' || !course.audioLanguage ? t('langEnglish') : course.audioLanguage}</span>
              </li>
              <li className={styles.classInfoItem}>
                <Subtitles size={16} className={styles.classInfoIcon} />
                <span>{course.subtitleLanguage === 'English, Vietnamese [Auto]' || !course.subtitleLanguage ? t('langEnglishVietnameseAuto') : course.subtitleLanguage}</span>
              </li>
              {course.includesMaterials && (
                <li className={styles.classInfoItem}>
                  <Package size={16} className={styles.classInfoIcon} />
                  <span>{t('courseMaterialsIncluded')}</span>
                </li>
              )}
            </ul>
          </div>

          <div className={styles.classDetailsDivider} />

          <div className={styles.pricingCard}>
            <div className={styles.pricingTop}>
              {discountPct > 0 && (
                <div className={styles.pricingDiscountLine}>
                  <span className={styles.pricingDiscountBadge}>{t('courseUpTo')} {discountPct}{t('courseOff')}</span>
                  <span className={styles.pricingOriginal}>USD {course.originalPrice.toFixed(2)}</span>
                </div>
              )}
              <div className={styles.pricingMainRow}>
                <span className={styles.pricingMain}>USD {course.price.toFixed(2)} ~</span>
                <span className={styles.pricingApprox}>{t('courseApproxPrice')} ⓘ</span>
              </div>
            </div>
            <div className={styles.couponList}>
              <div className={styles.couponRow}>
                <span>{t('courseDiscountCouponsLabel')}</span>
                <span className={styles.couponVal}>Max USD 10.00 <span className={styles.couponArrow}>›</span></span>
              </div>
              <div className={styles.couponRow}>
                <span>{t('courseWelcomeCoupons')}</span>
                <span className={styles.couponVal}>Max USD 20.00 <span className={styles.couponArrow}>›</span></span>
              </div>
            </div>
            <p className={styles.pricingNote}>{t('coursePricingNote')}</p>
          </div>
        </div>
      </section>

      {/* ── STICKY NAVIGATION */}
      <nav className={styles.stickyNav}>
        <div className={styles.stickyNavInner}>
          <a href="#intro" className={`${styles.navLink} ${styles.navLinkActive}`}>{t('courseNavIntro')}</a>
          <a href="#highlights" className={styles.navLink}>{t('courseNavHighlights')}</a>
          <a href="#instructor" className={styles.navLink}>{t('courseNavInstructor')}</a>
          <a href="#curriculum" className={styles.navLink}>{t('courseNavCurriculum')}</a>
          <a href="#recommended" className={styles.navLink}>{t('courseNavRecommended')}</a>
        </div>
      </nav>

      {/* ── INTRO BAND */}
      <section id="intro" className={styles.introBand}>
        <div className={styles.introBandInner}>
          <div className={styles.introIconGroup}>
            <span className={styles.introIconBubble} style={{ background: '#4f46e5' }}>字</span>
            <span className={styles.introIconBubble} style={{ background: '#0ea5e9' }}>🌐</span>
            <span className={styles.introIconBubble} style={{ background: '#f59e0b' }}>A</span>
          </div>
          <h2 className={styles.introHeadline}>
            {t('courseIntroBandTitle')}<br />
            <span className={styles.introHeadlineSub}>{t('courseIntroBandSub')}</span>
          </h2>
          <div className={styles.introFeatures}>
            <div className={styles.introFeatureBtn}>{t('courseFeature1')}</div>
            <div className={styles.introFeatureBtn}>{t('courseFeature2')}</div>
            <div className={styles.introFeatureBtn}>{t('courseFeature3')}</div>
          </div>
        </div>
      </section>

      {/* ── ENCYCLOPEDIA BAND */}
      <section id="highlights" className={styles.encyclopediaBand}>
        <div className={styles.encyclopediaBandInner}>
          <h2 className={styles.encyclopediaTitle}>{t('courseEncyclopediaTitle')}<span className={styles.encyclopediaDot}>■</span></h2>
          <div className={styles.encyclopediaDivider} />
          <p className={styles.encyclopediaDesc}>
            {t('courseEncyclopediaDesc')}
          </p>
          <div className={styles.encyclopediaDivider} />
          <div className={styles.encyclopediaCards}>
            <div className={styles.encyclopediaCard}>
              <div className={styles.encyclopediaCardIcon}>🎨</div>
              <p className={styles.encyclopediaCardSub}>{t('courseEncySub1')}</p>
              <p className={styles.encyclopediaCardTitle}>{t('courseEncyTitle1')}</p>
            </div>
            <div className={styles.encyclopediaCard}>
              <div className={styles.encyclopediaCardIcon}>📋</div>
              <p className={styles.encyclopediaCardSub}>{t('courseEncySub2')}</p>
              <p className={styles.encyclopediaCardTitle}>{t('courseEncyTitle2').replace('{n}', String(totalLessons))}</p>
            </div>
            <div className={styles.encyclopediaCard}>
              <div className={styles.encyclopediaCardIcon}>▶</div>
              <p className={styles.encyclopediaCardSub}>{t('courseEncySub3')}</p>
              <p className={styles.encyclopediaCardTitle}>{t('courseEncyTitle3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DARK ABOUT BAND */}
      <section className={styles.darkAboutBand}>
        <div className={styles.darkAboutInner}>
          <div className={styles.darkAboutLeft}>
            <h2 className={styles.darkAboutTitle}>
              {t('courseAboutTitle').replace('{author}', course.author).replace('{days}', String(totalLessons))}
            </h2>
          </div>
          <div className={styles.darkAboutRight}>
            <p className={styles.darkAboutDesc} dangerouslySetInnerHTML={{ 
              __html: t('courseAboutDesc').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />
          </div>
        </div>
      </section>

      {/* ── INSTRUCTOR */}
      <section id="instructor" className={styles.instructorBand}>
        <div className={styles.bandInner}>
          <h2 className={styles.sectionTitle}>{t('courseSectionInstructor')}</h2>
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
                <p>{t('courseDefaultBio').replace('{name}', course.author)}</p>
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

      {/* ── CURRICULUM */}
      <section id="curriculum" className={styles.curriculumBand}>
        <div className={styles.bandInner}>
          <h2 className={styles.sectionTitle}>{t('courseSectionCurriculum')}</h2>
          <CurriculumGrid chapters={course.chapters} courseId={course.id} isEnrolled={isEnrolled} />
        </div>
      </section>

      {/* ── RECOMMENDED */}
      <section id="recommended" className={styles.recommendedBand}>
        <div className={styles.bandInner}>
          <h2 className={styles.sectionTitle}>{t('courseSectionRecommended')}</h2>
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

      {/* ── STICKY BOTTOM CTA */}
      <div className={styles.stickyBottomCTA}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaLeft}>
            {discountPct > 0 && (
              <>
                <span className={styles.ctaOriginalPrice}>USD {course.originalPrice.toFixed(2)}</span>
                <span className={styles.ctaDiscountBadge}>{t('courseUpTo')} {discountPct}{t('courseOff')}</span>
              </>
            )}
            <span className={styles.ctaPrice}>USD {course.price.toFixed(2)} ~</span>
          </div>
          <AddToCartButton courseId={course.id} className={styles.ctaEarlyBirdBtn} label={t('courseBeEarlyBird')} />
        </div>
      </div>

    </main>
  );
}
