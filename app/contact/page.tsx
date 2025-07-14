"use client"

import type React from "react"


import { useState } from "react"

export default function Contact() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log("Form submitted:", { email, message })
    // Reset form
    setEmail("")
    setMessage("")
    alert("This feature is coming soon. Please contact with Whatsapps, Instagram, or Linkedin")
  }

  const handleInstagram = () => {
    window.open("https://www.instagram.com/aryo_dedeo/", "_blank")
  }

  const handleWhatsApp = () => {
    window.open("https://wa.me/+6289530513637", "_blank")
  }

  const handleLinkedin = () => {
    window.open("https://www.linkedin.com/in/yoannes-de-deo-haryo-wibisono-ba237a263", "_blank")
  }
  

  return (
    <div className="contact-container">
      <div className="section-header">
        <h1 className="page-title">Contact</h1>
        <p className="page-subtitle">Let&apos;s connect and work together</p>
      </div>

      <div className="contact-content">
        <div className="contact-form-section">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="your.email@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-textarea"
                placeholder="Tell me about your project or just say hello..."
                rows={5}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Send Message
            </button>
          </form>
        </div>

        <div className="contact-social-section">
          <h3 className="social-title">Connect with me</h3>
          <div className="social-buttons">
            <button onClick={handleInstagram} className="social-btn instagram-btn">
              <span className="social-icon">📷</span>
              Instagram
            </button>
            <button onClick={handleWhatsApp} className="social-btn whatsapp-btn">
              <span className="social-icon">💬</span>
              WhatsApp
            </button>
            <button onClick={handleLinkedin} className="social-btn whatsapp-btn">
              <span className="social-icon">🔗</span>
              Linkedin
            </button>
          </div>

          <div className="contact-info">
            <p className="contact-email">yoannes.haryo@gmail.com.com</p>
            <p className="contact-location">Yogyakarta, Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  )
}
