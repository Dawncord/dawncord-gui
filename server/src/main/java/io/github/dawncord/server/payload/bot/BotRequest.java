package io.github.dawncord.server.payload.bot;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@AllArgsConstructor
public class BotRequest {
    private final String token;
    private final List<String> intents;
}
