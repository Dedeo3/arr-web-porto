export default function About() {
  return (
    <div className="about-container">
      <div className="section-header">
        <h1 className="page-title">About Me</h1>
        <p className="page-subtitle">Get to know me better</p>
      </div>

      <div className="about-content">
        <div className="about-section">
          <h2 className="section-title">Background</h2>
          <p className="section-text">
            Passionate Mobile Developer with 1+ years of experience building high-performance Android apps (Kotlin/Jetpack Compose) 
            and cross-platform solutions (Flutter/React Native). Proven in full-stack development, including RESTful API design (Node.js) 
            and AI integration. Delivered projects 30% faster via Agile methodologies. 
          </p>
        </div>

        <div className="about-section">
          <h2 className="section-title">Skills</h2>
          <div className="skills-grid">
           <div className="skill-category">
  <h3 className="skill-category-title">Mobile Development</h3>
  <ul className="skill-list">
    <li>Kotlin & Jetpack Compose</li>
    <li>Java (Android)</li>
    <li>Flutter (Dart)</li>
    <li>React Native</li>
  </ul>
</div>

<div className="skill-category">
  <h3 className="skill-category-title">Backend Development</h3>
  <ul className="skill-list">
    <li>Node.js</li>
    <li>Express.js</li>
    <li>PHP</li>
    <li>Python</li>
    <li>MySQL</li>
    <li>Postgresql</li>
  </ul>
</div>

<div className="skill-category">
  <h3 className="skill-category-title">Frontend & Web</h3>
  <ul className="skill-list">
    <li>HTML, CSS, JavaScript</li>
    <li>Vue JS</li>
    <li>React JS</li>
    <li>Next JS</li>
  </ul>
</div>

<div className="skill-category">
  <h3 className="skill-category-title">Tools & Collaboration</h3>
  <ul className="skill-list">
    <li>Git & GitHub Management</li>
    <li>Figma</li>
    <li>MS Office</li>
    <li>VS Code</li>
    <li>Android Studio</li>
    <li>Postman</li>
    <li>Docker</li>
  </ul>
</div>

<div className="skill-category">
  <h3 className="skill-category-title">Core Strength</h3>
  <ul className="skill-list">
    <li>Problem Solving</li>
    <li>Continuous Learning</li>
  </ul>
</div>

          </div>
        </div>

        <div className="about-section">
          <h2 className="section-title">Interests</h2>
          <p className="section-text">
            I’m driven by a deep curiosity for technology and a strong desire to keep growing. In a world where tech evolves rapidly, I’m excited to continuously adapt, learn, and make the most of every innovation that comes my way.
          </p>
        </div>
      </div>
    </div>
  )
}
