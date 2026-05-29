// app/dashboard/inbox/layout.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { InboxSidebar} from "@/components/dashboard/inbox-sidebar";
import { ChatView } from "@/components/dashboard/chat-view";

export default function InboxLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedId = searchParams.get("conversation") ?? undefined;

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <InboxSidebar
                    onConversationSelect={(id) =>
                        router.push(`/dashboard/inbox?conversation=${encodeURIComponent(id)}`)
                    }
                    selectedConversationId={selectedId}
                />
                <main className="flex-1 h-screen overflow-hidden">
                    {selectedId ? <ChatView conversationId={selectedId} /> : children}
                </main>
            </div>
        </SidebarProvider>
    );
}