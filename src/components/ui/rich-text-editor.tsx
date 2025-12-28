"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { cn } from "@/lib/utils"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Code,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Undo,
    Redo,
    Palette,
    Highlighter,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing...", className }: RichTextEditorProps) {
    const [isFocused, setIsFocused] = useState(false)
    const [, setUpdate] = useState(0)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-brand-primary underline',
                },
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        onTransaction: () => {
            setUpdate(s => s + 1)
        },
    })

    // Sync value changes from parent
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "")
        }
    }, [value, editor])

    const setLink = useCallback(() => {
        if (!editor) return
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    if (!editor) {
        return null
    }

    // Prevent focus loss when clicking toolbar buttons
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
    }

    // Focus editor when clicking the container
    const handleContainerClick = () => {
        editor.chain().focus().run()
    }

    return (
        <div
            className={cn(
                "bg-[#0a0c14] border rounded-xl overflow-hidden transition-all cursor-text",
                isFocused
                    ? "border-[#a4f8ff] ring-2 ring-[#a4f8ff]/20"
                    : "border-white/5 hover:border-white/10",
                className
            )}
            onClick={handleContainerClick}
        >
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 flex-wrap bg-[#0f111a]" onMouseDown={handleMouseDown}>
                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-white/5">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                    >
                        <Undo className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-10 disabled:cursor-not-allowed transition-colors"
                    >
                        <Redo className="w-4 h-4" />
                    </button>
                </div>

                {/* Text Formatting */}
                <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors font-bold",
                            editor.isActive('bold')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors italic",
                            editor.isActive('italic')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors underline",
                            editor.isActive('underline')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive('code')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Code className="w-4 h-4" />
                    </button>
                </div>

                {/* Links & Colors */}
                <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
                    <button
                        type="button"
                        onClick={setLink}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive('link')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const color = window.prompt('Hex Color', '#a4f8ff')
                            if (color) editor.chain().focus().setColor(color).run()
                        }}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive('textStyle')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Palette className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive('highlight')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Highlighter className="w-4 h-4" />
                    </button>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive({ textAlign: 'left' })
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive({ textAlign: 'center' })
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive({ textAlign: 'right' })
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive({ textAlign: 'justify' })
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <AlignJustify className="w-4 h-4" />
                    </button>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-0.5 px-2 border-r border-white/5">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive('bulletList')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                            editor.isActive('orderedList')
                                ? "bg-[#a4f8ff]/20 text-[#a4f8ff]"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>
                </div>

                {/* Heading Dropdown */}
                <div className="flex items-center gap-2 pl-2">
                    <select
                        className="h-8 px-2 bg-transparent border border-white/5 rounded-lg text-[11px] font-bold text-white/40 hover:text-white/60 focus:outline-none focus:border-white/10 cursor-pointer appearance-none pr-8 relative bg-[#0a0c14]"
                        value={
                            editor.isActive('heading', { level: 1 }) ? 'h1' :
                                editor.isActive('heading', { level: 2 }) ? 'h2' :
                                    editor.isActive('heading', { level: 3 }) ? 'h3' :
                                        'normal'
                        }
                        onChange={(e) => {
                            const value = e.target.value
                            if (value === 'normal') {
                                editor.chain().focus().setParagraph().run()
                            } else if (value === 'h1') {
                                editor.chain().focus().toggleHeading({ level: 1 }).run()
                            } else if (value === 'h2') {
                                editor.chain().focus().toggleHeading({ level: 2 }).run()
                            } else if (value === 'h3') {
                                editor.chain().focus().toggleHeading({ level: 3 }).run()
                            }
                        }}
                    >
                        <option value="normal">NORMAL</option>
                        <option value="h1">H1</option>
                        <option value="h2">H2</option>
                        <option value="h3">H3</option>
                    </select>
                </div>
            </div>

            {/* Editor Content */}
            <div className="relative">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
