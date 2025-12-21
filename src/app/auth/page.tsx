"use client"

import { useState, use } from "react"
import { signIn, signUp } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import Link from "next/link"

export default function AuthPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>
}) {
    const params = use(searchParams)
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = isLogin
            ? await signIn(formData)
            : await signUp(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-24 max-w-md">
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-black">
                            {isLogin ? "Welcome Back" : "Create Account"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {params.message && (
                            <div className="mb-6 p-4 rounded-lg bg-brand/10 border border-brand/20 text-brand text-sm text-center">
                                {params.message}
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form action={handleSubmit} className="space-y-4">
                            <div>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="Email"
                                    required
                                    className="bg-white/5 border-white/10 focus:border-brand"
                                />
                            </div>
                            <div>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    className="bg-white/5 border-white/10 focus:border-brand"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-brand text-black font-bold hover:bg-brand/90"
                                disabled={loading}
                            >
                                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm text-white/40 hover:text-brand transition-colors"
                            >
                                {isLogin
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Sign in"}
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <Link
                                href="/"
                                className="text-xs text-white/30 hover:text-white/50 transition-colors"
                            >
                                ← Back to home
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
