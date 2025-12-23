"use client";
import { ArrowRight } from "lucide-react";

export function FlowButton({ text = "Modern Button" }: { text?: string }) {
    return (
        <button className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full border-[1.5px] border-white/20 bg-transparent px-8 py-3 text-sm font-semibold text-white transition-all duration-500 hover:border-transparent hover:text-black active:scale-95">
            {/* Glow Effect Circle */}
            <span className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a4f8ff] opacity-0 transition-all duration-500 group-hover:h-56 group-hover:w-56 group-hover:opacity-100" />

            {/* Content Container */}
            <div className="relative z-10 flex items-center gap-2 transition-transform duration-500 group-hover:translate-x-2">
                {/* Left Arrow (Hidden initially) */}
                <ArrowRight className="absolute -left-6 h-4 w-4 text-black opacity-0 transition-all duration-500 group-hover:left-0 group-hover:opacity-100" />

                {/* Text */}
                <span className="transition-transform duration-500 group-hover:translate-x-3">{text}</span>

                {/* Right Arrow (Visible initially) */}
                <ArrowRight className="h-4 w-4 transition-all duration-500 group-hover:translate-x-6 group-hover:opacity-0" />
            </div>
        </button>
    );
}
