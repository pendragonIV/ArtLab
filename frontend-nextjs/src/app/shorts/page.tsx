import Header from '@/components/Header';

export default function ShortsPage() {
  return (
    <div style={{ backgroundColor: '#000', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '20px' }}>
        
        {/* TikTok/Shorts style container */}
        <div style={{ width: '400px', height: '80vh', background: '#121212', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid #333' }}>
          
          {/* Fake Video Player */}
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}>
            <h1 style={{ color: '#fff', opacity: 0.5 }}>[Short Video Playing]</h1>
          </div>
          
          {/* Overlay UI */}
          <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', padding: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>How to shade realistic eyes</h3>
            <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '16px' }}>Elena Rostova • Illustration</p>
            
            <button style={{ width: '100%', background: '#ff0044', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              Go to Full Course
            </button>
          </div>
          
          {/* Right sidebar actions */}
          <div style={{ position: 'absolute', right: '16px', bottom: '120px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
               🤍
            </div>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
               💬
            </div>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
               ↗️
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
