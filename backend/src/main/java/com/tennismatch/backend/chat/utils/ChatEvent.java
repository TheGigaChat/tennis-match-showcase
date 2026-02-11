package com.tennismatch.backend.chat.utils;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter @Builder
public class ChatEvent {
    public enum Kind { MESSAGE, TYPING, READ }

    private Kind kind;
    private Object data;

    public static ChatEvent message(Object dto){ return ChatEvent.builder().kind(Kind.MESSAGE).data(dto).build();}
    public static ChatEvent typing(long userId, boolean isTyping){
        return ChatEvent.builder().kind(Kind.TYPING).data(java.util.Map.of("userId",userId,"isTyping",isTyping,"ts",System.currentTimeMillis())).build();
    }
    public static ChatEvent read(long userId, Long lastSeenId){
        return ChatEvent.builder().kind(Kind.READ).data(java.util.Map.of("userId",userId,"lastSeenId",lastSeenId)).build();
    }
}
