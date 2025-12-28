import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, Download, ExternalLink } from "lucide-react"
import Link from "next/link"

export function OrderActions({ order }: { order: any }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border-white/10 text-white">
                <DropdownMenuItem className="gap-2 focus:bg-white/5 focus:text-white" asChild>
                    <Link href={`/admin/invoices/${order.readable_id || order.id}`}>
                        <Eye className="w-4 h-4 text-muted-foreground" /> View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 focus:bg-white/5 focus:text-white">
                    <Download className="w-4 h-4 text-muted-foreground" /> Invoice
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 focus:bg-white/5 focus:text-white">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" /> Track Payment
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
