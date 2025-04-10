"use client"

import { useEffect, useState } from "react"

const emojis = ["❤️", "💕", "💘", "💖", "💗", "💓", "💞", "💝", "😍", "🥰"]

export function FallingHearts({ density = "medium", containerClass = "", contained = false, speed = "normal" }) {
  const [hearts, setHearts] = useState<
    Array<{ id: number; emoji: string; left: number; top: number; duration: number; delay: number; size: number }>
  >([])

  useEffect(() => {
    // Determine number of hearts based on density
    let count = 15
    if (density === "low") count = 8
    if (density === "high") count = 25

    // Determine duration multiplier based on speed
    let durationMultiplier = 1
    if (speed === "fast") durationMultiplier = 0.6
    if (speed === "slow") durationMultiplier = 1.5

    // Create initial hearts with distributed positions throughout the container
    const initialHearts = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100, // random horizontal position from 0-100%
      top: Math.random() * 100, // random vertical position from 0-100%
      duration: (5 + Math.random() * 7) * durationMultiplier, // random duration adjusted by speed
      delay: Math.random() * 5 * durationMultiplier, // random delay adjusted by speed
      size: Math.random() * 1.2 + 0.8, // random size between 0.8-2.0rem
    }))

    setHearts(initialHearts)

    // Add new hearts periodically
    const interval = setInterval(
      () => {
        setHearts((prev) => {
          // Add a new heart at a random position
          const newHeart = {
            id: Date.now(),
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            left: Math.random() * 100,
            top: Math.random() * 40, // Start in the top 40% of the container
            duration: (5 + Math.random() * 7) * durationMultiplier,
            delay: 0,
            size: Math.random() * 1.2 + 0.8,
          }

          // Remove oldest heart if we have too many
          const updatedHearts = [...prev, newHeart]
          if (updatedHearts.length > count * 1.5) {
            updatedHearts.shift()
          }

          return updatedHearts
        })
      },
      speed === "fast" ? 800 : 1000,
    ) // Generate hearts faster if speed is fast

    return () => clearInterval(interval)
  }, [density, speed])

  const containerClassName = contained
    ? `falling-hearts-container-contained ${containerClass}`
    : `falling-hearts-container ${containerClass}`

  return (
    <div className={containerClassName}>
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className={`falling-emoji ${speed === "fast" ? "falling-emoji-fast" : ""}`}
          style={{
            left: `${heart.left}%`,
            top: `${heart.top}%`,
            animation: `falling ${heart.duration}s linear ${heart.delay}s forwards`,
            fontSize: `${heart.size}rem`,
          }}
        >
          {heart.emoji}
        </div>
      ))}
    </div>
  )
}
