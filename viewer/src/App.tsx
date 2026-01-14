import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ThreejsSceneLayer } from './mapbox-layer'

// Token from mapbox-3d-tiles example
const MAPBOX_TOKEN = 'pk.eyJ1IjoiamsyNzY5OTM4NTciLCJhIjoiY2x0bW5ubHViMWVnaDJtcDZlYW92aWt2eCJ9.mBXt-vny9iFy4lzC0g1gbw'

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    // Center to match the conversion ENU origin (Shenzhen)
    const center: [number, number] = [113.950997, 22.582630]

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11', // or v10 as in example
      center: center,
      zoom: 18,
      pitch: 60,
      bearing: 0,
      antialias: true // Important for threejs
    })

    mapRef.current = map

    map.on('load', () => {
      console.log('Map loaded')

      const layer = new ThreejsSceneLayer({
        id: 'threejs-layer',
        refCenter: center
      })

      map.addLayer(layer)

      // Add 3DGS Tileset
      // Pointing to the converted data path
      // IMPORTANT: UrlParamsPlugin requires an absolute URL
      const tilesetUrl = new URL('../public/data/result/tileset.json', window.location.href).href

      console.log('Loading tileset from:', tilesetUrl)
      fetch(tilesetUrl).then(res => {
        console.log('Fetch tileset status:', res.status)
        return res.text()
      }).then(text => {
        console.log('Fetch tileset content length:', text.length)
        if (text.length < 100) console.log('Content:', text)
      }).catch(err => console.error('Fetch error:', err))

      layer.addTileset({
        id: '3dgs-tileset',
        url: tilesetUrl,
        isGaussianSplatting: true,
        maxGaussianSplatingCount: 4096 * 4096,
        downloadMaxJobs: 4,
        parseMaxJobs: 1
      })

      console.log('Layer and tileset added')
    })


    return () => {
      map.remove()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default App

