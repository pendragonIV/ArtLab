import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

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
};

type InstructorProfile = {
  name: string;
  courseCount: number;
  categories: string[];
  totalStudents: number;
  courses: Course[];
};

export default async function InstructorPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5149'}/api/instructors/${name}`, { cache: "no-store" });
  if (!res.ok) return notFound();

  const instructor: InstructorProfile = await res.json();

  // Generate avatar initials URL
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=6366f1&color=fff&size=128&bold=true`;

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* INSTRUCTOR HERO */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <img src={avatarUrl} alt={instructor.name} className={styles.avatar} />
            <div className={styles.heroInfo}>
              <h1 className={styles.name}>{instructor.name}</h1>
              <div className={styles.cats}>
                {instructor.categories.map((cat) => (
                  <span key={cat} className={styles.catBadge}>{cat}</span>
                ))}
              </div>
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <strong>{instructor.courseCount}</strong>
                  <span>Courses</span>
                </div>
                <div className={styles.statItem}>
                  <strong>{instructor.totalStudents.toLocaleString()}</strong>
                  <span>Students</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COURSES SECTION */}
        <section className={styles.coursesSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Courses by {instructor.name}
              <span className={styles.count}>({instructor.courseCount})</span>
            </h2>
            <div className={styles.grid}>
              {instructor.courses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
