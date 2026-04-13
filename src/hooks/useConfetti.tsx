import React from 'react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']
const SHAPES = ['●', '■', '▲', '★', '♦', '✿']
const PARTICLE_COUNT = 55

export interface ConfettiParticle {
  id: number
  x: number
  color: string
  shape: string
  size: number
  delay: number
  duration: number
}

function makeParticle(id: number, originX: number): ConfettiParticle {
  return {
    id,
    x: originX + (Math.random() - 0.5) * 220,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 8 + Math.random() * 10,
    delay: Math.random() * 300,
    duration: 850 + Math.random() * 600,
  }
}

/**
 * Returns `[particles, fire]`.
 * Call `fire(originX)` when a task completes — colourful particles rain down.
 */
export function useConfetti(): [ConfettiParticle[], (originX?: number) => void] {
  const [particles, setParticles] = React.useState<ConfettiParticle[]>([])
  const nextIdRef = React.useRef(0)

  const fire = React.useCallback((originX = window.innerWidth / 2) => {
    const batch = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
      makeParticle(nextIdRef.current + i, originX),
    )
    nextIdRef.current += PARTICLE_COUNT
    setParticles(p => [...p, ...batch])
    setTimeout(() => {
      setParticles(p => {
        const ids = new Set(batch.map(b => b.id))
        return p.filter(q => !ids.has(q.id))
      })
    }, 1600)
  }, [])

  return [particles, fire]
}

/** Fixed overlay that renders all active confetti particles. */
export function ConfettiOverlay({ particles }: { particles: ConfettiParticle[] }) {
  if (particles.length === 0) return null
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
    >
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.x}px`,
            color: p.color,
            fontSize: `${p.size}px`,
            animation: `confetti-fall ${p.duration}ms ${p.delay}ms ease-in forwards`,
            display: 'inline-block',
          }}
        >
          {p.shape}
        </span>
      ))}
    </div>
  )
}
