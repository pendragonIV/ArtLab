import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import CurriculumGrid from "./CurriculumGrid";
import CourseCard from "@/components/CourseCard";
import CourseDetailClient from "./CourseDetailClient";

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
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/courses/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();

  const course: Course = await res.json();
  const totalLessons = course.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
  const discountPct = course.originalPrice > course.price
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : 0;

  // Check enrollment status
  let isEnrolled = false;
  try {
    const session = await getServerSession();
    if (session?.user?.email) {
      const enrollRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/courses/${id}/is-enrolled?email=${encodeURIComponent(session.user.email)}`,
        { cache: 'no-store' }
      );
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        isEnrolled = enrollData.isEnrolled === true;
      }
    }
  } catch {}

  const recRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/courses`, { cache: 'no-store' });
  let recommendedCourses: Course[] = [];
  if (recRes.ok) {
    const allCourses: Course[] = await recRes.json();
    recommendedCourses = allCourses.filter(c => c.id !== course.id).slice(0, 3);
  }

  const tags = course.category
    ? course.category.split(',').map(t => t.trim()).filter(Boolean)
    : ['Art', 'Design'];

  return (
    <>
      <Header />
      <CourseDetailClient
        course={course}
        totalLessons={totalLessons}
        discountPct={discountPct}
        isEnrolled={isEnrolled}
        tags={tags}
        recommendedCourses={recommendedCourses}
        CurriculumGrid={CurriculumGrid}
        CourseCard={CourseCard}
      />
      <Footer />
    </>
  );
}
