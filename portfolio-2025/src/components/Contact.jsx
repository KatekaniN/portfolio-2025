import React from 'react'

const Contact = () => (
  <section className="contact-section">
    <h2>Send a Message to the Castle</h2>
    <form className="contact-form">
      <input type="text" placeholder="Your Name" required />
      <input type="email" placeholder="Your Email" required />
      <textarea placeholder="Your Message" required />
      <button type="submit">Send</button>
    </form>
  </section>
)

export default Contact 