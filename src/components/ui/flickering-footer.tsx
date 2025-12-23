"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ClassValue, clsx } from "clsx";
import * as Color from "color-bits";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { Logo } from "@/components/layout/logo";
import { useSiteSettingsWithDefaults } from "@/context/site-settings-context";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Helper function to convert any CSS color to rgba
export const getRGBA = (
    cssColor: React.CSSProperties["color"],
    fallback: string = "rgba(180, 180, 180)",
): string => {
    if (typeof window === "undefined") return fallback;
    if (!cssColor) return fallback;

    try {
        // Handle CSS variables
        if (typeof cssColor === "string" && cssColor.startsWith("var(")) {
            const element = document.createElement("div");
            element.style.color = cssColor;
            document.body.appendChild(element);
            const computedColor = window.getComputedStyle(element).color;
            document.body.removeChild(element);
            return Color.formatRGBA(Color.parse(computedColor));
        }

        return Color.formatRGBA(Color.parse(cssColor));
    } catch (e) {
        console.error("Color parsing failed:", e);
        return fallback;
    }
};

// Helper function to add opacity to an RGB color string
export const colorWithOpacity = (color: string, opacity: number): string => {
    if (!color.startsWith("rgb")) return color;
    return Color.formatRGBA(Color.alpha(Color.parse(color), opacity));
};

export const Icons = {
    logo: ({ className }: { className?: string }) => (
        <svg
            width="42"
            height="24"
            viewBox="0 0 42 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("size-4 fill-brand", className)}
        >
            <g clipPath="url(#clip0_322_9172)">
                <path
                    d="M22.3546 0.96832C22.9097 0.390834 23.6636 0.0664062 24.4487 0.0664062C27.9806 0.0664062 31.3091 0.066408 34.587 0.0664146C41.1797 0.0664284 44.481 8.35854 39.8193 13.2082L29.6649 23.7718C29.1987 24.2568 28.4016 23.9133 28.4016 23.2274V13.9234L29.5751 12.7025C30.5075 11.7326 29.8472 10.0742 28.5286 10.0742H13.6016L22.3546 0.96832Z"
                    fill="currentColor"
                />
                <path
                    d="M19.6469 23.0305C19.0919 23.608 18.338 23.9324 17.5529 23.9324C14.021 23.9324 10.6925 23.9324 7.41462 23.9324C0.821896 23.9324 -2.47942 15.6403 2.18232 10.7906L12.3367 0.227022C12.8029 -0.257945 13.6 0.0855283 13.6 0.771372L13.6 10.0754L12.4265 11.2963C11.4941 12.2662 12.1544 13.9246 13.473 13.9246L28.4001 13.9246L19.6469 23.0305Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_322_9172">
                    <rect width="42" height="24" fill="white" />
                </clipPath>
            </defs>
        </svg>
    ),
};

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
    squareSize?: number;
    gridGap?: number;
    flickerChance?: number;
    color?: string;
    width?: number;
    height?: number;
    className?: string;
    maxOpacity?: number;
    text?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: number | string;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
    squareSize = 3,
    gridGap = 3,
    flickerChance = 0.2,
    color = "#B4B4B4",
    width,
    height,
    className,
    maxOpacity = 0.15,
    text = "",
    fontSize = 140,
    fontWeight = 600,
    ...props
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const memoizedColor = useMemo(() => {
        return getRGBA(color);
    }, [color]);

    const drawGrid = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        cols: number,
        rows: number,
        squares: Float32Array,
        dpr: number,
    ) => {
        ctx.clearRect(0, 0, width, height);

        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
        if (!maskCtx) return;

        if (text) {
            maskCtx.save();
            maskCtx.scale(dpr, dpr);
            maskCtx.fillStyle = "white";
            maskCtx.font = `${fontWeight} ${fontSize}px var(--font-heading), "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            maskCtx.textAlign = "center";
            maskCtx.textBaseline = "middle";
            maskCtx.fillText(text, width / (2 * dpr), height / (2 * dpr));
            maskCtx.restore();
        }

        // Optimization: Get the mask data once for the entire canvas
        const maskData = maskCtx.getImageData(0, 0, width, height).data;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * (squareSize + gridGap) * dpr;
                const y = j * (squareSize + gridGap) * dpr;
                const squareWidth = squareSize * dpr;
                const squareHeight = squareSize * dpr;

                // Sample the center pixel of the square to check for text
                // This is much faster than checking every pixel or calling getImageData per square
                const centerX = Math.floor(x + squareWidth / 2);
                const centerY = Math.floor(y + squareHeight / 2);

                // Ensure bounds
                if (centerX >= width || centerY >= height) continue;

                // Calculate index in the Uint8ClampedArray (RGBA)
                const index = (centerY * width + centerX) * 4;

                // Check alpha or color channel (white text has 255 in R, G, B)
                // We check if red channel > 0
                const hasText = maskData[index] > 0;

                const opacity = squares[i * rows + j];
                const finalOpacity = hasText
                    ? Math.min(1, opacity * 3 + 0.4)
                    : opacity;

                ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity);
                ctx.fillRect(x, y, squareWidth, squareHeight);
            }
        }
    },
        [memoizedColor, squareSize, gridGap, text, fontSize, fontWeight],
    );

    const setupCanvas = useCallback(
        (canvas: HTMLCanvasElement, width: number, height: number) => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const cols = Math.ceil(width / (squareSize + gridGap));
            const rows = Math.ceil(height / (squareSize + gridGap));

            const squares = new Float32Array(cols * rows);
            for (let i = 0; i < squares.length; i++) {
                squares[i] = Math.random() * maxOpacity;
            }

            return { cols, rows, squares, dpr };
        },
        [squareSize, gridGap, maxOpacity],
    );

    const updateSquares = useCallback(
        (squares: Float32Array, deltaTime: number) => {
            for (let i = 0; i < squares.length; i++) {
                if (Math.random() < flickerChance * deltaTime) {
                    squares[i] = Math.random() * maxOpacity;
                }
            }
        },
        [flickerChance, maxOpacity],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let gridParams: ReturnType<typeof setupCanvas>;

        const updateCanvasSize = () => {
            const newWidth = width || container.clientWidth;
            const newHeight = height || container.clientHeight;
            setCanvasSize({ width: newWidth, height: newHeight });
            gridParams = setupCanvas(canvas, newWidth, newHeight);
        };

        updateCanvasSize();

        let lastTime = 0;
        const animate = (time: number) => {
            if (!isInView) return;

            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            updateSquares(gridParams.squares, deltaTime);
            drawGrid(
                ctx,
                canvas.width,
                canvas.height,
                gridParams.cols,
                gridParams.rows,
                gridParams.squares,
                gridParams.dpr,
            );
            animationFrameId = requestAnimationFrame(animate);
        };

        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });

        resizeObserver.observe(container);

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0 },
        );

        intersectionObserver.observe(canvas);

        if (isInView) {
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
        };
    }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

    return (
        <div
            ref={containerRef}
            className={cn(`h-full w-full ${className}`)}
            {...props}
        >
            <canvas
                ref={canvasRef}
                className="pointer-events-none"
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                }}
            />
        </div>
    );
};

export function useMediaQuery(query: string) {
    const [value, setValue] = useState(false);

    useEffect(() => {
        function checkQuery() {
            const result = window.matchMedia(query);
            setValue(result.matches);
        }
        checkQuery();
        window.addEventListener("resize", checkQuery);
        const mediaQuery = window.matchMedia(query);
        mediaQuery.addEventListener("change", checkQuery);
        return () => {
            window.removeEventListener("resize", checkQuery);
            mediaQuery.removeEventListener("change", checkQuery);
        };
    }, [query]);

    return value;
}

export const siteConfig = {
    hero: {
        description: "Rainyday connects digital creators with a global audience through secure, scalable Web3 architecture and instant delivery.",
    },
    footerLinks: [
        {
            title: "Company",
            links: [
                { id: 1, title: "About", url: "/about" },
                { id: 2, title: "Contact", url: "/support" },
                { id: 3, title: "Feedback", url: "/feedback" },
                { id: 4, title: "Store", url: "/store" },
            ],
        },
        {
            title: "Products",
            links: [
                { id: 5, title: "All Products", url: "/store" },
                { id: 6, title: "Software", url: "/store" },
                { id: 7, title: "Services", url: "/store" },
                { id: 8, title: "Accounts", url: "/store" },
            ],
        },
        {
            title: "Resources",
            links: [
                { id: 9, title: "F.A.Q", url: "/faq" },
                { id: 10, title: "Support", url: "/support" },
                { id: 11, title: "Cart", url: "/cart" },
            ],
        },
    ],
};

export const FlickeringFooter = () => {
    const tablet = useMediaQuery("(max-width: 1024px)");
    const { settings } = useSiteSettingsWithDefaults()

    const siteName = settings?.general.name || "Rainyday"

    return (
        <footer id="footer" className="w-full pb-0 border-t border-white/[0.05]" suppressHydrationWarning>
            <div className="container mx-auto flex flex-col md:flex-row md:items-start md:justify-between p-8 md:p-10 gap-x-10 gap-y-8" suppressHydrationWarning>
                <div className="flex flex-col items-start justify-start gap-y-6 max-w-xs mx-0" suppressHydrationWarning>
                    <Logo variant="footer" />
                    <p className="tracking-tight text-white/40 font-medium leading-relaxed" suppressHydrationWarning>
                        {settings?.general.description || siteConfig.hero.description}
                    </p>
                </div>
                <div className="md:w-1/2" suppressHydrationWarning>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-10" suppressHydrationWarning>
                        {siteConfig.footerLinks.map((column, columnIndex) => (
                            <ul key={columnIndex} className="flex flex-col gap-y-4" suppressHydrationWarning>
                                <li className="text-xs font-black text-white/20 uppercase tracking-widest" suppressHydrationWarning>
                                    {column.title}
                                </li>
                                {column.links.map((link) => (
                                    <li
                                        key={link.id}
                                        className="group inline-flex cursor-pointer items-center justify-start gap-1 text-sm font-bold text-white/40 hover:text-brand transition-all duration-300 ease-out"
                                        suppressHydrationWarning
                                    >
                                        <Link href={link.url}>{link.title}</Link>
                                        <div className="flex size-4 items-center justify-center translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100" suppressHydrationWarning>
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-full h-48 md:h-64 relative z-0 overflow-hidden" suppressHydrationWarning>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#000000]/50 to-[#000000] z-10" suppressHydrationWarning />
                <div className="absolute inset-0 mx-6" suppressHydrationWarning>
                    <FlickeringGrid
                        text={siteName.toUpperCase()}
                        fontSize={tablet ? 80 : 120}
                        className="h-full w-full"
                        squareSize={2}
                        gridGap={tablet ? 2 : 3}
                        color="var(--brand)"
                        maxOpacity={0.4}
                        flickerChance={0.15}
                        fontWeight="900"
                    />
                </div>
            </div>
            <div className="container mx-auto px-10 py-8 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20" suppressHydrationWarning>
                <p suppressHydrationWarning>© {new Date().getFullYear()} {siteName} Digital. All rights reserved.</p>
                <div className="flex gap-8" suppressHydrationWarning>
                    <Link href="/terms" className="hover:text-brand transition-colors">Terms</Link>
                    <Link href="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
                </div>
            </div>
        </footer>
    );
};
