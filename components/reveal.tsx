"use client"

import React, { useEffect, useRef, useState } from "react"

type Variant = "fade-up" | "fade-right" | "fade-left" | "zoom"

export function Reveal({
  children,
  className = "",
  variant = "fade-up",
  delay = 0,
  threshold = 0.15,
  once = false,
}: {
  children: React.ReactNode
  className?: string
  variant?: Variant
  delay?: number
  threshold?: number
  once?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true)
            if (once) io.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])

  const baseHidden = "opacity-0 transform"
  const baseShow = "opacity-100 transform-none"

  const variantHidden =
    variant === "fade-up"
      ? "translate-y-6"
      : variant === "fade-right"
      ? "-translate-x-6"
      : variant === "fade-left"
      ? "translate-x-6"
      : variant === "zoom"
      ? "scale-[0.96]"
      : ""

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out will-change-transform ${
        visible ? baseShow : `${baseHidden} ${variantHidden}`
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
