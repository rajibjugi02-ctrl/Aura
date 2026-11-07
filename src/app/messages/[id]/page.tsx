"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatStore } from "@/store/useChatStore";
import MessagesInboxPage from "../page";

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectConversation, conversations } = useChatStore();

  const conversationId = params?.id as string;

  useEffect(() => {
    if (conversationId) {
      const exists = conversations.some((c) => c.id === conversationId);
      if (exists) {
        selectConversation(conversationId);
      } else {
        router.push("/messages");
      }
    }
  }, [conversationId, conversations, selectConversation, router]);

  return <MessagesInboxPage />;
}

