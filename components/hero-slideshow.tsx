"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Slide = { src: string; alt?: string }

type Props = {
  images: Slide[]
  intervalMs?: number
  className?: string
  heightClasses?: string // Tailwind classes for responsive heights
}

export function HeroSlideshow({
  images,
  intervalMs = 3500,
  className = "",
  heightClasses = "h-[420px] md:h-[480px] lg:h-[560px]",
}: Props) {
  const slides = useMemo(() => images?.filter(Boolean) || [], [images])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastVisibility = useRef<'visible' | 'hidden'>('visible')

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length]
  )
  const goTo = useCallback((i: number) => setIndex(i % slides.length), [slides.length])

  // Autoplay with pause on hover and on tab hidden
  useEffect(() => {
    const isHidden = typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
    if (slides.length <= 1 || paused || isHidden) return
    const id = setInterval(() => go(1), intervalMs)
    return () => clearInterval(id)
  }, [slides.length, paused, intervalMs, go])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => {
      lastVisibility.current = document.visibilityState as 'visible' | 'hidden'
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.matches(":focus, :focus-within")) return
      if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  // Touch swipe
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0
    let moved = false
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      moved = false
    }
    const onMove = () => {
      moved = true
    }
    const onEnd = (e: TouchEvent) => {
      if (!moved) return
      const dx = e.changedTouches[0].clientX - startX
      if (Math.abs(dx) > 40) {
        go(dx > 0 ? -1 : 1)
      }
    }
    el.addEventListener("touchstart", onStart, { passive: true })
    el.addEventListener("touchmove", onMove, { passive: true })
    el.addEventListener("touchend", onEnd)
    return () => {
      el.removeEventListener("touchstart", onStart)
      el.removeEventListener("touchmove", onMove)
      el.removeEventListener("touchend", onEnd)
    }
  }, [go])

  if (!slides || slides.length === 0) return null

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClasses} rounded-2xl shadow-2xl overflow-hidden group ${className}`}
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Slideshow Layanan"
    >
      {slides.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i === index ? "false" : "true"}
        >
          <Image
            src={img.src}
            alt={img.alt || "Hero Image"}
            fill
            className="object-cover"
            priority={i === 0}
          />
          {/* Subtle gradient overlays for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/10" />
        </div>
      ))}

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/35 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition focus:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/35 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition focus:opacity-100"
          >
            ›
          </button>
        </>
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2.5 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
