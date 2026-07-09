import gsap from 'gsap'

// Efecto magnético
export function handleMouseMove(e) {
  const btn = e.currentTarget
  const content = btn.querySelector('.magnetic')

  if (!content) return

  const rect = btn.getBoundingClientRect()

  // centro del botón
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  // distancia del mouse al centro
  const x = e.clientX - centerX
  const y = e.clientY - centerY

  // mueve el botón un poco
  gsap.to(btn, {
    x: x * 0.25,
    y: y * 0.25,
    duration: 0.3,
    ease: 'power2.out',
    overwrite: true,
  })

  // mueve el contenido un poco más para el efecto "magnético"
  gsap.to(content, {
    x: x * 0.35,
    y: y * 0.35,
    duration: 0.35,
    ease: 'power2.out',
    overwrite: true,
  })
}

export function handleMouseLeave(e) {
  const btn = e.currentTarget
  const content = btn.querySelector('.magnetic')

  gsap.to(btn, {
    x: 0,
    y: 0,
    duration: 0.6,
    ease: 'elastic.out(1, 0.4)',
    overwrite: true,
  })

  if (content) {
    gsap.to(content, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.4)',
      overwrite: true,
    })
  }
}
