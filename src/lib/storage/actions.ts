"use server"

import { createClient } from "@/lib/supabase/server"

const BUCKET_PRODUCT_FILES = "product-files"
const BUCKET_INVOICES = "invoices"

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
}

export async function uploadProductFile(file: File, productId: string) {
    const supabase = await createClient()

    const fileExt = file.name.split(".").pop()
    const filePath = `${productId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase
        .storage
        .from(BUCKET_PRODUCT_FILES)
        .upload(filePath, file)

    if (error) throw error
    return data.path
}

export async function uploadInvoice(file: File, orderId: string) {
    const supabase = await createClient()

    const filePath = `${orderId}/invoice.pdf`

    const { data, error } = await supabase
        .storage
        .from(BUCKET_INVOICES)
        .upload(filePath, file, { upsert: true })

    if (error) throw error
    return data.path
}

export async function deleteFile(bucket: string, path: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .storage
        .from(bucket)
        .remove([path])

    if (error) throw error
}

export async function getProductFileUrl(path: string) {
    return getSignedUrl(BUCKET_PRODUCT_FILES, path)
}

export async function getInvoiceUrl(path: string) {
    return getSignedUrl(BUCKET_INVOICES, path)
}

export async function uploadAvatar(file: File, adminId: string) {
    const supabase = await createClient()

    const fileExt = file.name.split(".").pop()
    const filePath = `${adminId}/avatar.${fileExt}`

    const { data, error } = await supabase
        .storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

    if (error) {
        console.error("[UPLOAD_AVATAR_CRITICAL] Bucket: avatars", error)
        throw error
    }
    return data.path
}

export async function getAvatarUrl(path: string) {
    const supabase = await createClient()
    const { data } = supabase.storage.from("avatars").getPublicUrl(path)
    return data.publicUrl
}
