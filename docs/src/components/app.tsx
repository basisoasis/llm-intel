import Nav from './nav';
import Hero from './hero';
import InstallSection from './install-section';
import DemoSection from './demo-section';
import Footer from './footer';

export default function App() {
  return (
    <div className="min-h-screen bg-bg font-mono">
      <Nav />
      <main>
        <Hero />
        <InstallSection />
        <DemoSection />
      </main>
      <Footer />
    </div>
  )
}