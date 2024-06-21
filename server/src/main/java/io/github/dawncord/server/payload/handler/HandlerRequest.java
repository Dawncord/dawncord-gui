package io.github.dawncord.server.payload.handler;

import lombok.Getter;

import java.util.List;

@Getter
public class HandlerRequest {
    private String className;
    private String methodName;
    private HandlerRequest child;
    private HandlerRequest next;
    private List<String> params;
}
