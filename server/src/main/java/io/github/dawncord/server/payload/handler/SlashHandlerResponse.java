package io.github.dawncord.server.payload.handler;

import lombok.Getter;

@Getter
public class SlashHandlerResponse extends BaseHandlerResponse<SlashHandlerResponse> {
    private String commandName;
}
