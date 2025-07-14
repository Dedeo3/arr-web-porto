"use client"

import Image from "next/image"



export default function Home() {

  
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
          <h2 className="hero-subtitle">Mobile and Back-end Developer</h2>
           <p className="hero-description">
                        Currently, I am a <span className="highlight">fresh graduate</span> with a Bachelor&apos;s degree in <span className="highlight">Informatics</span>. As a <span className="role-highlight">programmer</span>, I love <span className="highlight">solving problems</span> not only in code but also in everyday situations. I&apos;m passionate about both <span className="tech-highlight">mobile</span> and <span className="tech-highlight">back-end development</span>, and I enjoy building products that are not only functional but also <span className="highlight">impactful</span>.
                        <br></br>
                        I have strong experience in developing various applications, from designing intuitive mobile interfaces using <span className="tech-highlight">Kotlin with Jetpack Compose</span> and <span className="tech-highlight">Flutter</span>, also building robust back-end systems with <span className="tech-highlight">Node.js and Express</span>. I thrive in <span className="highlight">collaborative environments</span> and am always eager to <span className="highlight">learn new technologies</span>, improve my skills, and contribute meaningfully to any team or project I&apos;m part of.
                    </p>
          <div className="hero-buttons">
           <button onClick={downloadFile} className="btn btn-primary">
             Download CV
            </button>
            <a href="https://github.com/Dedeo3" target="_blank" className="btn btn-secondary">
              Github
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


function downloadFile() {
      const link = document.createElement('a');
      link.href = "/Yoannes_De_Deo_Haryo_Wibisono_Mobile developer_CV_UPDATE.pdf"; 
      link.download = 'Yoannes_De_Deo_Haryo_Wibisono_CV.pdf';
      link.click();
    }
