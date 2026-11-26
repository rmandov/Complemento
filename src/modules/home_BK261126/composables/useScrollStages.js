import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stageIndexAtProgress, stageScrollProgress } from '../utils/journeyPath'
import { JOURNEY_CONFIG } from '../config/journeyConfig'

gsap.registerPlugin(ScrollTrigger)

function getNavbarOffset() {
  if (typeof window === 'undefined') return 0
  const layout = JOURNEY_CONFIG.layout
  if (window.matchMedia('(max-width: 767px)').matches) return layout.navbarMobilePx
  if (window.matchMedia('(max-width: 1023px)').matches) return layout.navbarTabletPx
  return layout.navbarDesktopPx
}

/** Única fuente de verdad del scroll y de la etapa activa para los tres elementos. */
export function useScrollStages(sectionRef, stageCount) {
  const progress = ref(0)
  const activeIndex = ref(0)
  let trigger = null
  let scrollTween = null
  let observer = null
  let refreshFrame = 0

  function update(progressValue) {
    progress.value = Math.max(0, Math.min(1, progressValue))
    activeIndex.value = stageIndexAtProgress(progress.value, stageCount)
  }

  function goToStage(index) {
    if (!trigger || stageCount <= 0) return
    const destination = trigger.start + (trigger.end - trigger.start) * stageScrollProgress(index, stageCount)
    scrollTween?.kill()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, destination)
      return
    }
    const scrollState = { y: window.scrollY }
    scrollTween = gsap.to(scrollState, {
      y: destination,
      duration: JOURNEY_CONFIG.journey.jumpDurationSeconds,
      ease: 'power2.inOut',
      overwrite: true,
      onUpdate: () => window.scrollTo(0, scrollState.y),
      onComplete: () => { scrollTween = null },
    })
  }

  function goToMap() {
    scrollTween?.kill()
    const target = document.querySelector(JOURNEY_CONFIG.layout.mapTarget)
    if (!target) {
      console.warn(`No existe la sección de destino: ${JOURNEY_CONFIG.layout.mapTarget}`)
      return
    }
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  function refresh() {
    cancelAnimationFrame(refreshFrame)
    refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
  }

  onMounted(async () => {
    await nextTick()
    if (!sectionRef.value || stageCount < 1) return
    trigger = ScrollTrigger.create({
      trigger: sectionRef.value,
      start: () => `top top+=${getNavbarOffset()}`,
      end: () => stageCount > 1 ? 'bottom bottom' : '+=1',
      invalidateOnRefresh: true,
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    })
    update(trigger.progress)
    observer = new ResizeObserver(refresh)
    // Solo observar la sección; NO el sticky ni el canvas para evitar bucles de refresh.
    observer.observe(sectionRef.value)
    window.addEventListener('load', refresh)
    refresh()
  })

  onBeforeUnmount(() => {
    scrollTween?.kill()
    trigger?.kill()
    observer?.disconnect()
    cancelAnimationFrame(refreshFrame)
    window.removeEventListener('load', refresh)
  })

  return { progress, activeIndex, goToStage, goToMap }
}
