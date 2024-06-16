package io.github.dawncord.server.payload.slash;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
public class SlashHandlerResponse {
    private String commandName;
    private String className;
    private String methodName;
    private SlashHandlerResponse child;
    private SlashHandlerResponse next;
}
