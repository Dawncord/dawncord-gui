package io.github.dawncord.server.payload.handler;

import lombok.Getter;

@Getter
public abstract class BaseHandlerResponse<T> {
    private String className;
    private String methodName;
    private T child;
    private T next;
}
