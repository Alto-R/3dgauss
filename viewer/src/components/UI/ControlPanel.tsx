import { useControls } from 'leva'

export function ControlPanel() {
  useControls('Camera', {
    fov: { value: 60, min: 30, max: 120, step: 1 },
    near: { value: 0.1, min: 0.01, max: 10, step: 0.01 },
    far: { value: 10000, min: 100, max: 50000, step: 100 }
  })

  useControls('Info', {
    'Tileset URL': { value: '/data/tileset.json', editable: false },
    'Help': { value: '使用鼠标控制视角', editable: false }
  })

  return null
}
