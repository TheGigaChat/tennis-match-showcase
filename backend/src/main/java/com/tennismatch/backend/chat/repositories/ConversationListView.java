package com.tennismatch.backend.chat.repositories;

import java.time.Instant;

public interface ConversationListView {
  Long getConversationId();
  Long getPartnerId();
  Instant getLastMessageAt();
  Instant getCreatedAt();
  String getStatus();
  String getPartnerName();
  String getPartnerPhoto();
  Long getUnreadCount();
  String getLastMessageSnippet();
}
