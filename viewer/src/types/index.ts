export interface TilesetConfig {
  url: string
  center?: [number, number]
}

export interface ViewerState {
  isLoading: boolean
  error: string | null
  tileCount: number
}

export interface GaussianPoint {
  position: [number, number, number]
  color: [number, number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number, number]
}
