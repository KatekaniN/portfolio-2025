import './App.css'
import Layout from './components/Layout'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Timeline from './components/Timeline'
import Achievements from './components/Achievements'
import Contact from './components/Contact'
import ProgressBar from './components/ProgressBar'

function App() {
  return (
    <Layout>
      <ProgressBar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Timeline />
      <Achievements />
      <Contact />
    </Layout>
  )
}

export default App
