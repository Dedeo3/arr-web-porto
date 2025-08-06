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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          animation: modalAppear 0.3s ease-out;
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          padding: 24px 24px 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background-color: #f3f4f6;
          color: #1f2937;
        }

        .modal-body {
          padding: 0 24px 24px 24px;
        }

        .modal-body p {
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 16px;
        }

        .cv-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cv-option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          width: 100%;
        }

        .cv-option-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .cv-option-btn.mobile:hover {
          border-color: #10b981;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
        }

        .cv-option-btn.backend:hover {
          border-color: #f59e0b;
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
        }

        .cv-option-btn.fullstack:hover {
          border-color: #8b5cf6;
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
        }

        .cv-option-btn.all:hover {
          border-color: #ef4444;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.2);
        }

        .cv-icon {
          font-size: 32px;
          min-width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          border-radius: 10px;
        }

        .cv-option-btn h4 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .cv-option-btn p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        @media (max-width: 640px) {
          .modal-content {
            margin: 16px;
            width: calc(100% - 32px);
          }
          
          .cv-option-btn {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }
          
          .cv-icon {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
}
