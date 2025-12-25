"use client"

import { useState, useEffect } from "react"
import { MeshGradient } from "@paper-design/shaders-react"

export function ShaderBackground() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="absolute inset-0 bg-black w-full h-full" />

    return (
        <div className="absolute inset-0 w-full h-full opacity-30">
            <MeshGradient
                className="w-full h-full"
                colors={["#000000", "#0a4f4f", "#164e63", "#a4f8ff"]}
                speed={0.5}
            />
        </div>
    )
}
