package io.github.dawncord.server.payload.method;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MethodResponse {
    private String name;
    private List<MethodParam> params;

    @Getter
    @Setter
    public static class MethodParam {
        private String type;
        private String name;
    }
}
