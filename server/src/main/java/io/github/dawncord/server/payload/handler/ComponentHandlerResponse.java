package io.github.dawncord.server.payload.handler;

import lombok.Getter;

@Getter
public class ComponentHandlerResponse extends BaseHandlerResponse<ComponentHandlerResponse> {
    private String componentId;
}
