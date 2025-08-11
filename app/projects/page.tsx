export default function Projects() {
  const projects = [
    {
      id: 1,
      title: "Morket-ai (assistance supermarket)",
      description:
        "An assistance for morket supermart that built with Flutter, featuring user authentication, AI integration for become assistance morket supermart.",
      technologies: ["Postgresql", "Flutter", "Node express JS", "Flutter (Dart)", "Neon", "Together AI"],
      liveDemo: "https://www.linkedin.com/posts/yoannes-de-deo-haryo-wibisono-ba237a263_hello-everyone-i-want-to-share-details-about-activity-7349138008274587648-hR2F?utm_source=share&utm_medium=member_desktop&rcm=ACoAAECpFSoB4oxus802W1wCiG_fQWP2CstfVtw",
      repository: "https://github.com/Dedeo3/morket-ai.git",
    },
    {
      id: 2,
      title: "Multifactor attendance app (PresentDW)",
      description:
  "A secure and modern attendance tracking application. PresentDW leverages multifactor authentication methods such as check location with geolocation, QR code scanning and facial recognition to ensure accurate and tamper-resistant attendance verification, ideal for universities and organizations.",
      technologies: ["Kotlin", "Node.js", "Socket.io", "ML kit", "Antispoof", "Geolocation", "QR code"],
      repository: "https://github.com/Dedeo3/MultiFactorAuthentication.git",
    },
    {
      id: 3,
      title: "Educational Puzzle Game",
      description:
  "An interactive educational puzzle game designed to enhance learning through engaging activities. This project combines learning materials, quizzes, crosswords, and drag-and-drop puzzles, complete with scoring features. Ideal for classroom use, the game helps students grasp complex topics through play-based learning and visual interactivity.",

      technologies: ["Phaser js", "Vercel"],
      liveDemo: "https://puzzle-game2-new.vercel.app/",
      repository: "https://github.com/Dedeo3/puzzle-game2-new.git",
    },
    {
      id: 4,
      title: "Clarylisk",
      description:
        "Clarylisk is a Web3 platform that protects creators from harmful donation content and gambling promos. Powered by AI and blockchain, it ensures ethical, transparent, and secure monetization—so creators can focus on what matters: their content.",
      technologies: ["Next.js", "Tailwind CSS", "Node.js", "Express.js", "PostgreSQL", "OpenAI API", "JWT", "IPFS", "Ethers.js", "Vite", "Docker", "GitHub Actions"
],
      liveDemo: "https://clarylisk.netlify.app/",
      repository: "https://github.com/Bimajadivaaa/clarylisk",
    },
     {
      id: 5,
      title: "Napnad",
      description:
        "Napnad is a Web3-based application designed to tackle the growing issue of sleep deprivation in modern society. By incentivizing better sleep habits, Sleep2Earn aims to improve productivity, mental health, and overall well-being. Users are rewarded with tokens for meeting predefined sleep goals, all while ensuring their sensitive health data remains private and secure",
      technologies: ["Next.js", "Tailwind CSS", "Node.js", "Express.js", "PostgreSQL", "OpenAI API", "JWT", "IPFS", "Ethers.js", "Vite", "Docker", "GitHub Actions"
],
      liveDemo: "https://snoorefi.syaad.dev/",
      repository: "https://github.com/NapNad",
    },
        {
      id: 6,
      title: "BentoApps",
      description:
  "A robust backend API for managing application workflows—from CRUD operations to payment integration. BentoApps is built with scalability and security in mind, featuring token-based authentication, automated deployments, and containerized services.",
      technologies: ["Node.js", "Express.js", "PostgreSQL", "JWT", "Docker", "GitHub Actions"
],
      repository: "https://github.com/Dedeo3/bentoApps",
    },
     {
      id: 7,
      title: "Bee Scrape",
      description:
  "The Bee Scrape application aims to provide users with a comprehensive and user-friendly platform for scraping and analyzing economic data from various marketplaces and search engines. The primary goal is to empower businesses, including SMEs, corporations, and individual entities, with valuable insights derived from data scraping activities. By achieving these goals, Bee Scrape aims to become a valuable tool for businesses to gather, analyze, and leverage economic data for their growth and decision-making processes.",

      technologies: ["Kotlin", "Jetpack Compose", "Docker","Node js","Express js","Python","Cloud", "GitHub Actions"
],
      repository: "https://github.com/Dedeo3/Project-Bee-Scrape-CH2_PS401",
    },
         {
      id: 8,
      title: "Noted app",
      description:
  "A minimalist note-taking app inspired by Google Keep, designed for fast, intuitive, and organized productivity. Noted lets users quickly capture ideas, to-do lists, and thoughts in a clean Web3-ready interface—powered by Next.js and OpenAI integration for smart note suggestions and summaries.",

      technologies: ["Next.js", "Tailwind CSS", "Vite", "GitHub Actions"
],
      repository: "https://github.com/Dedeo3/NotedApp",
    },
      {
      id: 9,
      title: "Dicostory",
      description:
  "Dicostory is a social storytelling app where users can share their moments, discover stories from others, and explore them through interactive maps. Equipped with user authentication, story creation, real-time search, and like functionality, Distory blends personal expression with location-based discovery.",
      technologies: ["Kotlin", "XML", "GitHub Actions", "Api integration"
],
      repository: "https://github.com/Dedeo3/4_AndroidIntermediate_YoannesDeDeo.git",
    },
          {
      id: 10,
      title: "GUSER",
      description:
  "GUSER is a sleek Android app that allows users to explore GitHub profiles with ease. Featuring live search, detailed user lists, and the ability to bookmark favorite developers, GUSER offers a clean and efficient way to discover and manage GitHub accounts on the go.",

      technologies: ["Kotlin", "XML", "GitHub Actions", "Api integration"
],
      repository: "https://github.com/Dedeo3/3_androidfundamental_YoannesDeDeo.git",
    },
     {
      id: 11,
      title: "GPACAL",
     description:
  "GPACAL is a simple yet powerful GPA calculator designed for students to accurately compute their semester (IPS) and cumulative (IPK) performance. With an intuitive interface, GPACAL helps students track their academic progress with ease and confidence.",


      technologies: ["HTML", "CSS", "Javascript", "Netlify"
],
      liveDemo:"https://659e5235318079b148ca4382--friendly-wisp-19070c.netlify.app/ipk",
      repository: "https://github.com/Dedeo3/completed_count_IPK_IPS_apps",
    },
  ]

  return (
    <div className="projects-container">
      <div className="section-header">
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">A showcase of my recent work</p>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-content">
              <h3 className="project-title">{project.title}</h3>
              <p className="project-description">{project.description}</p>

              <div className="project-technologies">
                {project.technologies.map((tech, index) => (
                  <span key={index} className="tech-tag">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="project-links">
                <a href={project.liveDemo} className="project-link" target="_blank" rel="noopener noreferrer">
                  Live Demo
                </a>
                <a href={project.repository} className="project-link" target="_blank" rel="noopener noreferrer">
                  Repository
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  
}
