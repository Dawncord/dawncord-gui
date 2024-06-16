package io.github.dawncord.server.payload.slash;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@AllArgsConstructor
public class SlashHandlerResponse {
    private final String commandName;
    private final String className;
    private final String methodName;
    private final SlashHandlerResponse child;
    private final SlashHandlerResponse next;
}
