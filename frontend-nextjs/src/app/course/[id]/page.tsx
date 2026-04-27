import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

export default function CourseDetail({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* HERO VIDEO / COVER */}
        <section className={styles.hero}>
          <div className={styles.coverImageWrapper}>
            <img 
              src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1440&auto=format&fit=crop" 
              alt="Course Cover" 
              className={styles.coverImage}
            />
          </div>
          <div className={styles.figcaption}>
            {/* Some description content usually goes here */}
          </div>
          <div className={styles.earlyBirdBanner}>
            <button className={styles.earlyBirdBtn}>Be an Early Bird</button>
          </div>
        </section>

        {/* SUMMARY SECTION */}
        <section className={styles.summarySection}>
          <div className={styles.summaryContainer}>
            <div className={styles.detailsBox}>
              <h2 className={styles.detailsTitle}>Class Details</h2>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>• 30+ Video Lessons (Full HD)</div>
                <div className={styles.detailItem}>• Includes Blender & Substance Painter Project Files</div>
                <div className={styles.detailItem}>• Lifetime Access to Updates</div>
                <div className={styles.detailItem}>• English Subtitles Available</div>
                <div className={styles.detailItem}>• Exclusive Discord Community Access</div>
              </div>
            </div>
            
            <div className={styles.verticalDivider}></div>
            
            <div className={styles.priceBox}>
              <div className={styles.priceHeader}>
                <span className={styles.priceLabel}>Early Bird Special Price</span>
                <span className={styles.priceValue}>$89.00</span>
              </div>
              <button className={styles.actionBtn}>Go to Cart</button>
            </div>
          </div>
        </section>

        {/* LONG ARTICLE / CURRICULUM */}
        <article className={styles.article}>
          <div className={styles.articleContainer}>
            <h2 className={styles.articleTitle}>Portfolio Gallery</h2>
            
            <div className={styles.curriculumGrid}>
              {[...Array(16)].map((_, i) => (
                <div key={i} className={styles.curriculumCircle}></div>
              ))}
            </div>

            <div style={{ height: '2000px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: '#666', borderTop: '1px solid #E0E0E0', paddingTop: '40px' }}>
              [Detailed Curriculum Details Rendered Here]
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
