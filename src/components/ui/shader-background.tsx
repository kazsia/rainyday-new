"use client"

import { MeshGradient } from "@paper-design/shaders-react"

export function ShaderBackground() {
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
