import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { TilesRenderer } from '3d-tiles-renderer'
import { DebugTilesPlugin } from '3d-tiles-renderer/plugins'
import { useControls } from 'leva'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// 引入高斯泼溅相关模块
import { GLTFGaussianSplattingExtension } from '../splats/GLTFGaussianSplattingExtension'
import { GaussianSplattingTilesetPlugin } from '../splats/GaussianSplattingTilesetPlugin'
import { GLTFExtensionsPlugin } from '../splats/GLTFExtensionsPlugin'

interface GaussianViewerProps {
  url: string
}

export function GaussianViewer({ url }: GaussianViewerProps) {
  const { camera, gl } = useThree()
  const tilesRef = useRef<TilesRenderer | null>(null)
  const debugPluginRef = useRef<DebugTilesPlugin | null>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const groupRef = useRef<THREE.Group>(new THREE.Group())
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null)

  const { wireframe, showBoundingBoxes } = useControls('Viewer', {
    wireframe: false,
    showBoundingBoxes: false
  })

  useEffect(() => {
    const tiles = new TilesRenderer(url)

    // 注册调试插件
    const debugPlugin = new DebugTilesPlugin()
    debugPlugin.displayBoxBounds = showBoundingBoxes
    tiles.registerPlugin(debugPlugin)
    debugPluginRef.current = debugPlugin

    // 注册高斯泼溅插件
    tiles.registerPlugin(new GaussianSplattingTilesetPlugin(gl, camera))

    // 注册 GLTF 扩展插件，包含高斯泼溅扩展
    tiles.registerPlugin(
      new GLTFExtensionsPlugin({
        rtc: true,
        plugins: [
          (parser) => new GLTFGaussianSplattingExtension(parser, camera)
        ]
      })
    )

    tiles.setCamera(camera)
    tiles.setResolutionFromRenderer(camera, gl)

    // 监听 tileset 加载完成
    tiles.addEventListener('load-tileset', () => {
      console.log('Tileset loaded!')

      // 获取模型边界并移动相机
      const box = new THREE.Box3()
      tiles.getBoundingBox(box)

      if (!box.isEmpty()) {
        const center = new THREE.Vector3()
        const size = new THREE.Vector3()
        box.getCenter(center)
        box.getSize(size)

        const maxDim = Math.max(size.x, size.y, size.z)
        console.log('Model center:', center, 'size:', size)

        // 保存中心点用于 OrbitControls
        setModelCenter(center.clone())

        // 将相机移动到模型位置
        camera.position.set(
          center.x + maxDim * 2,
          center.y + maxDim * 2,
          center.z + maxDim * 2
        )
        camera.lookAt(center)
        camera.updateProjectionMatrix()

        // 更新 OrbitControls 的 target
        if (controlsRef.current) {
          controlsRef.current.target.copy(center)
          controlsRef.current.update()
        }
      }
    })

    // 监听模型加载 - 只在 wireframe 模式下修改材质
    tiles.addEventListener('load-model', (event) => {
      const scene = (event as any).scene
      if (wireframe) {
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            // 跳过高斯泼溅 mesh
            if ((child as any).isGaussianSplattingMesh) return

            child.material = new THREE.MeshBasicMaterial({
              wireframe: true,
              color: 0x00ff00
            })
          }
        })
      }
    })

    groupRef.current.add(tiles.group)
    tilesRef.current = tiles

    return () => {
      tiles.dispose()
      groupRef.current.remove(tiles.group)
    }
  }, [url, camera, gl])

  // 当 controlsRef 准备好且有模型中心时，更新 target
  useEffect(() => {
    if (controlsRef.current && modelCenter) {
      controlsRef.current.target.copy(modelCenter)
      controlsRef.current.update()
    }
  }, [modelCenter])

  useEffect(() => {
    if (debugPluginRef.current) {
      debugPluginRef.current.displayBoxBounds = showBoundingBoxes
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
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={0.1}
        maxDistance={1e8}
      />
    </>
  )
}
