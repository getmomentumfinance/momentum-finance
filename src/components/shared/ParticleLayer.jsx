import { useEffect, useRef } from 'react'

const COUNT = 28

function makeParticle(w, h) {
  return {
    x:    Math.random() * w,
    y:    Math.random() * h,
    r:    0.6 + Math.random() * 1.2,
    vx:   (Math.random() - 0.5) * 0.15,
    vy:   -0.08 - Math.random() * 0.12,
    o:    0.08 + Math.random() * 0.18,
  }
}

export default function ParticleLayer() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx    = canvas.getContext('2d')
    let raf
    let particles = []

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      particles = Array.from({ length: COUNT }, () => makeParticle(canvas.width, canvas.height))
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.o})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy

        if (p.y < -4)              p.y = canvas.height + 4
        if (p.x < -4)              p.x = canvas.width  + 4
        if (p.x > canvas.width + 4) p.x = -4
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
        opacity: 0.22,
      }}
    />
  )
}
