// All portfolio text lives here. Edit this file to change what the game shows.

export const PROFILE = {
  fullName: "Yoannes De Deo Haryo Wibisono",
  nick: "Dedeo",
  worldName: "Dedeo's World",
  role: "Mobile & Backend Developer",
  tagline: "Fresh graduate in Informatics who loves solving problems, in code and in everyday life.",
  bio: [
    "Passionate Mobile Developer with 1+ years of experience building high-performance Android apps (Kotlin / Jetpack Compose) and cross-platform solutions (Flutter / React Native). Proven in full-stack development, including RESTful API design (Node.js) and AI integration. Delivered projects 30% faster via Agile methodologies.",
    "I'm driven by a deep curiosity for technology and a strong desire to keep growing. In a world where tech evolves rapidly, I'm excited to continuously adapt, learn, and make the most of every innovation that comes my way.",
  ], 
}

export const CVS = [
  { label: "Mobile Developer", file: "/Yoannes De Deo Haryo Wibisono - Mobile developer - CV.pdf" },
  { label: "Backend Developer", file: "/Yoannes De Deo Haryo Wibisono - Back-end Developer - CV.pdf" },
  { label: "Mobile & Backend", file: "/Yoannes De Deo Haryo Wibisono - Mobile & Backend Developer - CV.pdf" },
  { label: "Full-stack Developer", file: "/Yoannes De Deo Haryo Wibisono - Full-stack Developer - CV.pdf" },
]

export const JOURNEY = [
  { title: "Informatics degree", text: "Graduated with a Bachelor's degree in Informatics and started building real products on the side." },
  { title: "Android first", text: "Learned native Android with Kotlin: GUSER (GitHub explorer) and Dicostory (social stories with maps)." },
  { title: "Team projects", text: "Shipped team products such as Bee Scrape (Kotlin + Node + Python) and the Web3 apps Clarylisk and Napnad." },
  { title: "AI and cross-platform", text: "Built Morket-ai with Flutter, Node and Together AI, and the PresentDW multifactor attendance app." },
  { title: "Today", text: "1+ years of experience, open to Mobile and Backend roles, always learning the next thing." },
]

export const WHAT_I_DO = [
  { icon: "📱", title: "Mobile apps", text: "Native Android with Kotlin + Jetpack Compose, and cross-platform with Flutter and React Native." },
  { icon: "⚙️", title: "Backend APIs", text: "RESTful APIs with Node.js, Express, PHP and Python on PostgreSQL / MySQL, containerized with Docker." },
  { icon: "🤖", title: "AI integration", text: "Putting LLMs and ML Kit to work: assistants, face checks, smart suggestions." },
  { icon: "🌐", title: "Web and Web3", text: "React, Next.js and Vue front ends, plus Ethers.js and IPFS for Web3 products." },
]

export type SkillGroup = { id: string; title: string; items: string[] }
export const SKILLS: SkillGroup[] = [
  {
    id: "frontend",
    title: "Mobile & Frontend",
    items: ["Kotlin & Jetpack Compose", "Java (Android)", "Flutter (Dart)", "React Native", "HTML, CSS, JavaScript", "Vue JS", "React JS", "Next JS"],
  },
  {
    id: "backend",
    title: "Backend & Data",
    items: ["Node.js", "Express.js", "PHP", "Python", "MySQL", "PostgreSQL"],
  },
  {
    id: "tools",
    title: "Tools & Cloud",
    items: ["Git & GitHub", "Docker", "Postman", "Figma", "VS Code", "Android Studio", "MS Office", "Problem Solving", "Continuous Learning"],
  },
]

export type Project = {
  title: string
  description: string
  tech: string[]
  live?: string
  repo?: string
  color: string
}

export const PROJECTS: Project[] = [
  {
    title: "Morket-ai",
    description:
      "An AI assistant for supermarket shoppers, built with Flutter. It features user authentication and an AI integration that acts as a personal market assistant.",
    tech: ["Flutter (Dart)", "Node Express", "PostgreSQL", "Neon", "Together AI"],
    live: "https://www.linkedin.com/posts/yoannes-de-deo-haryo-wibisono-ba237a263_hello-everyone-i-want-to-share-details-about-activity-7349138008274587648-hR2F?utm_source=share&utm_medium=member_desktop&rcm=ACoAAECpFSoB4oxus802W1wCiG_fQWP2CstfVtw",
    repo: "https://github.com/Dedeo3/morket-ai.git",
    color: "#34d399",
  },
  {
    title: "PresentDW",
    description:
      "A secure multifactor attendance app. It combines geolocation, QR code scanning and facial recognition to make attendance accurate and tamper-resistant, ideal for universities and organizations.",
    tech: ["Kotlin", "Node.js", "Socket.io", "ML Kit", "Antispoof", "Geolocation", "QR code"],
    repo: "https://github.com/Dedeo3/MultiFactorAuthentication.git",
    color: "#60a5fa",
  },
  {
    title: "Clarylisk",
    description:
      "A Web3 platform that protects creators from harmful donation content and gambling promos. Powered by AI and blockchain for ethical, transparent and secure monetization.",
    tech: ["Next.js", "Tailwind CSS", "Node.js", "Express.js", "PostgreSQL", "OpenAI API", "JWT", "IPFS", "Ethers.js", "Docker"],
    live: "https://clarylisk.netlify.app/",
    repo: "https://github.com/Bimajadivaaa/clarylisk",
    color: "#a78bfa",
  },
  {
    title: "Educational Puzzle Game",
    description:
      "An interactive educational puzzle game with learning materials, quizzes, crosswords and drag-and-drop puzzles, complete with scoring. Made for classrooms to learn through play.",
    tech: ["Phaser JS", "Vercel"],
    live: "https://puzzle-game2-new.vercel.app/",
    repo: "https://github.com/Dedeo3/puzzle-game2-new.git",
    color: "#fbbf24",
  },
  {
    title: "Napnad",
    description:
      "A Web3 Sleep2Earn app that tackles sleep deprivation. Users earn tokens for meeting sleep goals while their health data stays private and secure.",
    tech: ["Next.js", "Tailwind CSS", "Node.js", "Express.js", "PostgreSQL", "Ethers.js", "IPFS", "Docker"],
    live: "https://snoorefi.syaad.dev/",
    repo: "https://github.com/NapNad",
    color: "#818cf8",
  },
  {
    title: "BentoApps",
    description:
      "A robust backend API for managing application workflows, from CRUD to payment integration. Built for scalability and security with token auth, automated deploys and containers.",
    tech: ["Node.js", "Express.js", "PostgreSQL", "JWT", "Docker", "GitHub Actions"],
    repo: "https://github.com/Dedeo3/bentoApps",
    color: "#f472b6",
  },
  {
    title: "Bee Scrape",
    description:
      "A user-friendly platform for scraping and analyzing economic data from marketplaces and search engines, giving SMEs and businesses insights for growth and decision-making.",
    tech: ["Kotlin", "Jetpack Compose", "Node.js", "Express.js", "Python", "Docker", "Cloud", "GitHub Actions"],
    repo: "https://github.com/Dedeo3/Project-Bee-Scrape-CH2_PS401",
    color: "#facc15",
  },
  {
    title: "Noted App",
    description:
      "A minimalist note-taking app inspired by Google Keep. Capture ideas and to-do lists in a clean Web3-ready interface with OpenAI-powered suggestions and summaries.",
    tech: ["Next.js", "Tailwind CSS", "Vite", "GitHub Actions"],
    repo: "https://github.com/Dedeo3/NotedApp",
    color: "#2dd4bf",
  },
  {
    title: "Dicostory",
    description:
      "A social storytelling app: share moments, discover stories from others and explore them on an interactive map. Includes auth, story creation, real-time search and likes.",
    tech: ["Kotlin", "XML", "GitHub Actions", "API integration"],
    repo: "https://github.com/Dedeo3/4_AndroidIntermediate_YoannesDeDeo.git",
    color: "#fb923c",
  },
  {
    title: "GUSER",
    description:
      "A sleek Android app to explore GitHub profiles: live search, detailed user lists, and bookmarks for favorite developers.",
    tech: ["Kotlin", "XML", "GitHub Actions", "API integration"],
    repo: "https://github.com/Dedeo3/3_androidfundamental_YoannesDeDeo.git",
    color: "#94a3b8",
  },
  {
    title: "GPACAL",
    description:
      "A simple GPA calculator for students to compute semester (IPS) and cumulative (IPK) performance with an intuitive interface.",
    tech: ["HTML", "CSS", "JavaScript", "Netlify"],
    live: "https://659e5235318079b148ca4382--friendly-wisp-19070c.netlify.app/ipk",
    repo: "https://github.com/Dedeo3/completed_count_IPK_IPS_apps",
    color: "#f87171",
  },
]

export const CONTACT = {
  email: "aryowibi33@gmail.com",
  phone: "+62 895-3051-3637",
  whatsapp: "https://wa.me/+6289530513637",
  instagram: "https://www.instagram.com/aryo_dedeo/",
  instagramHandle: "@aryo_dedeo",
  linkedin: "https://www.linkedin.com/in/yoannes-de-deo-haryo-wibisono-ba237a263",
  github: "https://github.com/Dedeo3",
  location: "Yogyakarta, Indonesia",
}

export type SectionId = "about" | "projects" | "skills" | "contact"

export const SECTIONS: { id: SectionId; building: string; section: string; blurb: string }[] = [
  { id: "about", building: "My House", section: "About", blurb: "Who I am" },
  { id: "projects", building: "Project Gallery", section: "Projects", blurb: "What I built" },
  { id: "skills", building: "Workshop", section: "Skills", blurb: "How I build" },
  { id: "contact", building: "Post Office", section: "Contact", blurb: "Say hello" },
]

export type CharacterInfo = { name: string; blurb: string }
export const CHARACTER_INFO: CharacterInfo[] = [
  { name: "Kai", blurb: "Maroon hoodie, round glasses" },
  { name: "Mira", blurb: "Teal jacket, pink bow" },
]

// Guide dialogue (scripted). Each node: what the guide says and the answers the visitor can pick.
export type GuideAction = { label: string; next?: string; walk?: SectionId | "dock" }
export type GuideNode = { text: string; actions: GuideAction[] }

export const GUIDE_AVATAR = "Claude"
export const GUIDE: Record<string, GuideNode> = {
  root: {
    text: "Hi, I'm Claude, your guide to Dedeo's World. This island is the portfolio of Yoannes De Deo Haryo Wibisono, a Mobile and Backend Developer. Where would you like to start?",
    actions: [
      { label: "Who is Dedeo?", next: "about" },
      { label: "Show me his projects", next: "projects" },
      { label: "What can he build?", next: "skills" },
      { label: "How do I contact him?", next: "contact" },
      { label: "Let's go fishing", next: "fish" },
      { label: "I'll explore on my own", next: "free" },
    ],
  },
  about: {
    text: "Dedeo is a fresh Informatics graduate with 1+ years building Android apps with Kotlin and Jetpack Compose, plus Flutter and Node.js backends. His story is inside My House, the one with the red roof.",
    actions: [
      { label: "Take me to My House", walk: "about" },
      { label: "Ask something else", next: "root" },
    ],
  },
  projects: {
    text: "There are 11 projects: an AI shopping assistant, a face and QR attendance app, Web3 platforms and more. Each one has its own spot inside the Project Gallery, the white building with columns.",
    actions: [
      { label: "Take me to the Gallery", walk: "projects" },
      { label: "Ask something else", next: "root" },
    ],
  },
  skills: {
    text: "Mobile, frontend, backend, databases and tools, all laid out in the Workshop: terminal for mobile and frontend, server racks for backend, toolbox for tools and cloud.",
    actions: [
      { label: "Take me to the Workshop", walk: "skills" },
      { label: "Ask something else", next: "root" },
    ],
  },
  contact: {
    text: "The Post Office has everything: email, phone, WhatsApp, a message form, and links to Instagram, LinkedIn and GitHub. The clerk is friendly too.",
    actions: [
      { label: "Take me to the Post Office", walk: "contact" },
      { label: "Ask something else", next: "root" },
    ],
  },
  fish: {
    text: "Follow the south path to the dock. Stand near the end, face the water and press E to cast. When the bobber dips and the prompt says Bite, press E again to reel in. Don't be too early!",
    actions: [
      { label: "Take me to the dock", walk: "dock" },
      { label: "Ask something else", next: "root" },
    ],
  },
  free: {
    text: "Sure! Move with WASD or the joystick, Shift to run, Space to jump, and click the ground to walk. Open Places for shortcuts, or call me any time with the Guide button.",
    actions: [{ label: "Got it", walk: undefined }],
  },
}
