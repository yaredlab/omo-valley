import BackgroundVideo from './components/BackgroundVideo';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import NecklaceShowcase from './components/NecklaceShowcase';
import ThirdPage from './components/ThirdPage';
import DraggableCardDemo from './components/DraggableCardDemo';

function App() {
  return (
    <div className="w-full min-h-screen text-white selection:bg-[#00f0ff] selection:text-[#08070a]">
      {/*
        The video is position:fixed so it stays behind every section.
        ThirdPage (z-10) and DraggableCardDemo have solid backgrounds that
        naturally cover it once the user scrolls past the necklace section.
      */}
      <BackgroundVideo />
      <Navbar />

      {/* Hero — sits above the fixed video via z-index stacking context */}
      <div className="relative z-[1] w-full h-screen">
        <Hero />
      </div>

      {/*
        NecklaceShowcase:
        - z-index 2, starts fully transparent so the fixed video shows through
        - Three.js beads materialise on the woman's neck as you scroll
        - Background overlay fades to #061E29 as the camera zooms out
      */}
      <NecklaceShowcase />

      {/* Subsequent sections have solid backgrounds that cover the fixed video */}
      <ThirdPage />
      <DraggableCardDemo />
    </div>
  );
}

export default App;
