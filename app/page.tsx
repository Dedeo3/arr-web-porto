import Loader from "@/components/game/Loader"
import { CONTACT, PROFILE, PROJECTS, SKILLS } from "@/lib/content"

export default function Home() {
  return (
    <>
      <Loader />
      {/* Readable summary for search engines and screen readers while the 3D world loads. */}
      <div className="sr-only">
        <h1>
          {PROFILE.fullName} — {PROFILE.role}
        </h1>
        {PROFILE.bio.map((b, i) => (
          <p key={i}>{b}</p>
        ))}
        <h2>Skills</h2>
        <ul>
          {SKILLS.map((s) => (
            <li key={s.id}>
              {s.title}: {s.items.join(", ")}
            </li>
          ))}
        </ul>
        <h2>Projects</h2>
        <ul>
          {PROJECTS.map((p) => (
            <li key={p.title}>
              {p.title}: {p.description}
            </li>
          ))}
        </ul>
        <h2>Contact</h2>
        <p>
          {CONTACT.email} · {CONTACT.location}
        </p>
      </div>
    </>
  )
}
