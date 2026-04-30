import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Format slug for display
  const title = slug.replace('-', ' ').toUpperCase();

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', backgroundColor: '#121212', color: '#fff' }}>
        <div style={{ background: 'linear-gradient(135deg, #ff0044, #990022)', padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '16px' }}>{title} SPECIAL EVENT</h1>
          <p style={{ fontSize: '20px', opacity: 0.9 }}>Exclusive time-limited offers and benefits just for you.</p>
        </div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ padding: '40px', background: '#1e1e1e', borderRadius: '12px', border: '1px solid #333' }}>
            <h2 style={{ fontSize: '28px', color: '#facc15', marginBottom: '20px' }}>Grab your Coupon Code!</h2>
            <div style={{ display: 'inline-block', padding: '16px 32px', background: '#2a2a2a', border: '2px dashed #666', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', borderRadius: '8px' }}>
              ARTLAB-{title.replace(' ', '')}-2026
            </div>
            <p style={{ marginTop: '20px', color: '#a0a0a0' }}>Apply this code at checkout to receive your special discount on eligible courses.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
