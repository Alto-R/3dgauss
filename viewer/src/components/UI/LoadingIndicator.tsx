import { useState, useEffect } from 'react'

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '14px',
    zIndex: 1000,
    transition: 'opacity 0.3s ease'
  },
  title: {
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  info: {
    opacity: 0.8,
    fontSize: '12px'
  }
}

export function LoadingIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div style={styles.container}>
      <div style={styles.title}>3DGauss Viewer</div>
      <div style={styles.info}>
        <div>左键拖拽: 旋转视角</div>
        <div>右键拖拽: 平移</div>
        <div>滚轮: 缩放</div>
      </div>
    </div>
  )
}
