import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import { Suspense } from 'react'
import { GaussianViewer } from './components/GaussianViewer'
import { ControlPanel } from './components/UI/ControlPanel'
import { LoadingIndicator } from './components/UI/LoadingIndicator'

function App() {
  return (
    <>
      <Leva collapsed />
      <ControlPanel />
      <Canvas
        camera={{ position: [0, 50, 100], fov: 60, near: 0.1, far: 10000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#1a1a2e' }}
      >
        <Suspense fallback={null}>
          <GaussianViewer url="/data/tileset.json" />
        </Suspense>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
      </Canvas>
      <LoadingIndicator />
    </>
  )
}

export default App
