import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { TilesRenderer } from '3d-tiles-renderer'
import { useControls } from 'leva'
import * as THREE from 'three'

interface GaussianViewerProps {
  url: string
}

export function GaussianViewer({ url }: GaussianViewerProps) {
  const { camera, gl } = useThree()
  const tilesRef = useRef<TilesRenderer | null>(null)
  const groupRef = useRef<THREE.Group>(new THREE.Group())
  const [isLoaded, setIsLoaded] = useState(false)

  const { wireframe, showBoundingBoxes } = useControls('Viewer', {
    wireframe: false,
    showBoundingBoxes: false
  })

  useEffect(() => {
    const tiles = new TilesRenderer(url)

    tiles.setCamera(camera)
    tiles.setResolutionFromRenderer(camera, gl)

    tiles.onLoadTileSet = () => {
      console.log('Tileset loaded:', tiles.root)
      setIsLoaded(true)

      // 自动调整相机位置到场景中心
      if (tiles.root?.boundingVolume) {
        const box = tiles.root.boundingVolume.box
        if (box) {
          const center = new THREE.Vector3(box[0], box[1], box[2])
          console.log('Tileset center:', center)
        }
      }
    }

    tiles.onLoadModel = (scene) => {
      // 处理加载的模型
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (wireframe) {
            child.material = new THREE.MeshBasicMaterial({
              wireframe: true,
              color: 0x00ff00
            })
          }
        }
      })
    }

    groupRef.current.add(tiles.group)
    tilesRef.current = tiles

    return () => {
      tiles.dispose()
      groupRef.current.remove(tiles.group)
    }
  }, [url, camera, gl])

  useEffect(() => {
    if (tilesRef.current) {
      tilesRef.current.displayBoxBounds = showBoundingBoxes
    }
  }, [showBoundingBoxes])

  useFrame(() => {
    if (tilesRef.current) {
      tilesRef.current.setCamera(camera)
      tilesRef.current.setResolutionFromRenderer(camera, gl)
      tilesRef.current.update()
    }
  })

  return (
    <>
      <primitive object={groupRef.current} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={5000}
      />
      <gridHelper args={[1000, 100, 0x444444, 0x222222]} />
      <axesHelper args={[50]} />
    </>
  )
}
