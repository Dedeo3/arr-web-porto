"use client"

import Image from "next/image"



import { useState } from 'react';

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  const downloadFile = (cvType: string) => {
    let fileName = '';
    let downloadName = '';
    
    switch(cvType) {
      case 'backend':
        fileName = "/Yoannes De Deo Haryo Wibisono - Back-end Developer - CV.pdf";
        downloadName = 'Yoannes_De_Deo_Haryo_Wibisono_Backend_CV.pdf';
        break;
      case 'mobile':
        fileName = "/Yoannes De Deo Haryo Wibisono - Mobile developer - CV.pdf";
        downloadName = 'Yoannes_De_Deo_Haryo_Wibisono_Mobile_CV.pdf';
        break;
      case 'fullstack':
        fileName = "/Yoannes De Deo Haryo Wibisono - Full-stack Developer - CV.pdf";
        downloadName = 'Yoannes_De_Deo_Haryo_Wibisono_Fullstack_CV.pdf';
        break;
      case 'all':
        // Download semua CV
        downloadMultipleFiles();
        return;
      default:
        fileName = "/Yoannes De Deo Haryo Wibisono - Full-stack Developer - CV.pdf";
        downloadName = 'Yoannes_De_Deo_Haryo_Wibisono_Fullstack_CV.pdf';
    }
    
    const link = document.createElement('a');
    link.href = fileName;
    link.download = downloadName;
    link.click();
    
    setShowModal(false);
  };

  const downloadMultipleFiles = () => {
    const cvFiles = [
      {
        path: "/Yoannes De Deo Haryo Wibisono - Back-end Developer - CV.pdf",
        name: "Yoannes_De_Deo_Haryo_Wibisono_Backend_CV.pdf"
      },
      {
        path: "/Yoannes De Deo Haryo Wibisono - Mobile developer - CV.pdf", 
        name: "Yoannes_De_Deo_Haryo_Wibisono_Mobile_CV.pdf"
      },
      {
        path: "/Yoannes De Deo Haryo Wibisono - Full-stack Developer - CV.pdf",
        name: "Yoannes_De_Deo_Haryo_Wibisono_Fullstack_CV.pdf"
      }
    ];

    cvFiles.forEach((file, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = file.path;
        link.download = file.name;
        link.click();
      }, index * 100); // Delay sedikit antar download
    });
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="profile-image-container">
          <Image
            src="/profile.png"
            width={300}
            height={350}
            alt="Profile Photo"
            className="profile-image"
          />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Yoannes De Deo Haryo Wibisono</h1>
          <h2 className="hero-subtitle">Full-stack Developer</h2>
           <p className="hero-description">
                        Currently, I am a <span className="highlight">fresh graduate</span> with a Bachelor&apos;s degree in <span className="highlight">Informatics</span>. As a <span className="role-highlight">programmer</span>, I love <span className="highlight">solving problems</span> not only in code but also in everyday situations. I&apos;m passionate about both <span className="tech-highlight">mobile</span> and <span className="tech-highlight">back-end development</span>, and I enjoy building products that are not only functional but also <span className="highlight">impactful</span>.
                        <br></br>
                        I have strong experience in developing various applications, from designing intuitive mobile interfaces using <span className="tech-highlight">Kotlin with Jetpack Compose</span> and <span className="tech-highlight">Flutter</span>, also building robust back-end systems with <span className="tech-highlight">Node.js and Express</span>. I thrive in <span className="highlight">collaborative environments</span> and am always eager to <span className="highlight">learn new technologies</span>, improve my skills, and contribute meaningfully to any team or project I&apos;m part of.
                    </p>
          <div className="hero-buttons">
           <button onClick={() => setShowModal(true)} className="btn btn-primary">
             Download CV
            </button>
            <a href="https://github.com/Dedeo3" target="_blank" className="btn btn-secondary">
              Github
            </a>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Download CV</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Pilih versi CV yang ingin Anda download:</p>
              <div className="cv-options">
                <button 
                  onClick={() => downloadFile('mobile')} 
                  className="cv-option-btn mobile"
                >
                  <span className="cv-icon">📱</span>
                  <div>
                    <h4>Mobile Developer</h4>
                    <p>CV yang difokuskan untuk posisi Mobile Developer</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => downloadFile('backend')} 
                  className="cv-option-btn backend"
                >
                  <span className="cv-icon">⚙️</span>
                  <div>
                    <h4>Backend Developer</h4>
                    <p>CV yang difokuskan untuk posisi Backend Developer</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => downloadFile('fullstack')} 
                  className="cv-option-btn fullstack"
                >
                  <span className="cv-icon">🔧</span>
                  <div>
                    <h4>Fullstack Developer</h4>
                    <p>CV yang mencakup kemampuan Fullstack Development</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => downloadFile('all')} 
                  className="cv-option-btn all"
                >
                  <span className="cv-icon">📄</span>
                  <div>
                    <h4>Download Semua</h4>
                    <p>Download ketiga versi CV sekaligus</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
  /* ===== Modal Overlay ===== */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: grid;
    place-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: fadeIn .18s ease-out;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

  /* ===== Modal Card ===== */
  .modal-content {
    width: min(520px, 92vw);
    max-height: 88vh;
    overflow: hidden auto;
    border-radius: 18px;
    background: rgba(15,15,17,0.92);
    color: #e5e7eb;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 30px 90px rgba(0,0,0,0.55);
    animation: modalAppear .26s cubic-bezier(.2,.8,.2,1);
    position: relative;
    isolation: isolate;
  }
  .modal-content::before{
    content:"";
    position:absolute; inset:-1px;
    border-radius: 18px;
    background: conic-gradient(from 180deg at 50% 50%, rgba(99,102,241,.25), rgba(168,85,247,.22), transparent 70%);
    filter: blur(18px);
    opacity: .45;
    z-index: -1;
    pointer-events:none;
  }
  @keyframes modalAppear {
    from { opacity: 0; transform: translateY(14px) scale(.98) }
    to   { opacity: 1; transform: translateY(0) scale(1) }
  }

  /* ===== Header ===== */
  .modal-header {
    padding: 18px 20px 14px 20px;
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .modal-header h3 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: .2px;
    background: linear-gradient(135deg,#fff,#d1d5db);
    -webkit-background-clip:text; background-clip:text;
    -webkit-text-fill-color: transparent;
  }
  .modal-close {
    background: transparent;
    border: 0;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    color: #a1a1aa;
    width: 40px; height: 40px;
    display: grid; place-items: center;
    border-radius: 10px;
    transition: transform .15s ease, background .15s ease, color .15s ease;
    outline: none;
  }
  .modal-close:hover { background: rgba(255,255,255,.06); color: #fff; transform: translateY(-1px) }
  .modal-close:focus-visible { outline: 3px solid rgba(99,102,241,.5); outline-offset: 2px }

  /* ===== Body ===== */
  .modal-body { padding: 16px 20px 20px 20px }
  .modal-body p {
    margin: 0 0 16px 0;
    color: #a3a3a3;
    font-size: 15px;
  }

  /* ===== Options ===== */
  .cv-options { display: grid; gap: 12px }
  .cv-option-btn {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(20,20,22,0.85);
    color: #e5e7eb;
    cursor: pointer;
    text-align: left;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }
  .cv-option-btn::before{
    content:"";
    position:absolute; inset:0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
    transition: transform .6s cubic-bezier(.2,.8,.2,1);
    pointer-events:none;
  }
  .cv-option-btn:hover::before{ transform: translateX(100%) }
  .cv-option-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(0,0,0,.35);
    background: rgba(26,26,28,0.95);
    border-color: rgba(99,102,241,.35);
  }

  /* Variant hover accents */
  .cv-option-btn.mobile:hover   { border-color: rgba(16,185,129,.55); box-shadow: 0 16px 40px rgba(16,185,129,.18) }
  .cv-option-btn.backend:hover  { border-color: rgba(245,158,11,.55); box-shadow: 0 16px 40px rgba(245,158,11,.18) }
  .cv-option-btn.fullstack:hover{ border-color: rgba(139,92,246,.55); box-shadow: 0 16px 40px rgba(139,92,246,.18) }
  .cv-option-btn.all:hover      { border-color: rgba(239,68,68,.55);  box-shadow: 0 16px 40px rgba(239,68,68,.18) }

  .cv-icon {
    font-size: 26px;
    width: 48px; height: 48px;
    display: grid; place-items: center;
    border-radius: 12px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.08);
  }
  .cv-option-btn h4 {
    margin: 0 0 2px 0;
    font-size: 17px;
    font-weight: 800;
    color: #fff;
  }
  .cv-option-btn p {
    margin: 0;
    font-size: 13.5px;
    color: #a3a3a3;
  }

  /* Focus state for keyboard users */
  .cv-option-btn:focus-visible {
    outline: 3px solid rgba(99,102,241,.5);
    outline-offset: 2px;
  }

  /* ===== Mobile ===== */
  @media (max-width: 640px) {
    .modal-content { width: calc(100% - 28px); margin: 14px }
    .cv-option-btn {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 10px;
      padding: 16px;
    }
    .cv-icon { margin: 0 auto }
  }

  /* ===== Reduced Motion ===== */
  @media (prefers-reduced-motion: reduce) {
    .modal-overlay, .modal-content, .cv-option-btn { animation: none !important; transition: none !important }
  }
`}</style>

    </div>
  )
}
