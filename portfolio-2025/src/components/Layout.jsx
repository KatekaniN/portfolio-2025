import React from 'react'

const Layout = ({ children }) => (
  <div className="layout-glass">
    <header className="layout-header">
      <div className="logo-placeholder">👑</div>
      <div className="layout-controls">
        {/* Day/Night toggle */}
        <button aria-label="Toggle day/night mode" className="toggle-mode">🌞/🌜</button>
        {/* Mute button */}
        <button aria-label="Toggle sound" className="toggle-sound">🔊/🔇</button>
      </div>
    </header>
    <main>{children}</main>
  </div>
)

export default Layout 