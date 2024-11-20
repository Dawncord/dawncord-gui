package io.github.dawncord.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.dawncord.api.event.ButtonEvent;
import io.github.dawncord.api.event.ModalSubmitEvent;
import io.github.dawncord.api.event.SelectMenuEvent;
import io.github.dawncord.api.event.SlashCommandEvent;
import io.github.dawncord.api.utils.EventProcessor;
import io.github.dawncord.server.payload.handler.HandlerRequest;
import io.github.dawncord.server.payload.method.MethodResponse;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
public class HandlerService {
    private final BotService botService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public HandlerService(BotService botService) {
        this.botService = botService;
    }

    public void processSlash(HandlerRequest request, String commandName) {
        List<String> list = extractMethodNames(request);
        List<String> replyList = extractReplyMethodNames(request);

        botService.getBot().onSlashCommand(commandName, onEvent(SlashCommandEvent.class, list, replyList));
    }

    public void processComponent(HandlerRequest request, String eventType, String componentId) {
        List<String> list = extractMethodNames(request);
        List<String> replyList = extractReplyMethodNames(request);

        switch (eventType) {
            case "button" -> botService.getBot().onButton(componentId, onEvent(ButtonEvent.class, list, replyList));
            case "select" -> botService.getBot().onSelectMenu(componentId, onEvent(SelectMenuEvent.class, list, replyList));
            case "modal" -> botService.getBot().onModal(componentId, onEvent(ModalSubmitEvent.class, list, replyList));
        }
    }

    private List<String> extractMethodNames(HandlerRequest response) {
        List<String> list = new ArrayList<>();
        list.add(response.getMethodName());

        HandlerRequest current = response;
        while (current.getNext() != null) {
            current = current.getNext();
            list.add(current.getMethodName());
        }

        return list;
    }

    private List<String> extractReplyMethodNames(HandlerRequest response) {
        List<String> replyList = new ArrayList<>();

        if (response.getMethodName().equals("reply")) {
            HandlerRequest current = response.getChild();
            replyList.add(current.getMethodName());

            while (current.getNext() != null) {
                current = current.getNext();
                replyList.add(current.getMethodName());
            }
        }

        return replyList;
    }

    private <T> Consumer<T> onEvent(Class<T> eventClass, List<String> list, List<String> replyList) {
        return event -> {
            try {
                Method eventMethod;

                if (list.get(0).equals("reply")) {
                    eventMethod = eventClass.getMethod(list.get(0), String.class);

                    Method method = eventClass.getMethod(replyList.get(0));
                    Object object = method.invoke(event);

                    for (int i = 1; i < replyList.size(); i++) {
                        method = object.getClass().getMethod(replyList.get(i));
                        object = method.invoke(object);
                    }

                    eventMethod.invoke(event, object.toString());
                } else {
                    eventMethod = eventClass.getMethod(list.get(0));
                    Object object = eventMethod.invoke(event);

                    for (int i = 1; i < list.size(); i++) {
                        Method method = object.getClass().getMethod(list.get(i));
                        object = method.invoke(object);
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }

    public JsonNode handleEvent(Class<?> currentClass) {
        List<MethodResponse> methodResponses = Arrays.stream(currentClass.getMethods())
                .filter(method -> !method.getName().startsWith("lambda") && !method.getName().equals("UpdateData"))
                .filter(method -> Arrays.stream(method.getParameters()).noneMatch(p -> p.getType().equals(long.class)))
                .filter(method -> !method.getDeclaringClass().equals(Object.class))
                .map(method -> {
                    MethodResponse response = new MethodResponse();
                    response.setName(method.getName());

                    List<MethodResponse.MethodParam> params = Arrays.stream(method.getParameters())
                            .map(p -> {
                                MethodResponse.MethodParam param = new MethodResponse.MethodParam();
                                param.setType(p.getType().getName());
                                param.setName(p.getName());
                                return param;
                            })
                            .collect(Collectors.toList());
                    response.setParams(params);

                    return response;
                })
                .collect(Collectors.toList());

        ObjectNode node = mapper.createObjectNode();
        node.put("current", currentClass.getName());
        node.set("methods", mapper.convertValue(methodResponses, ArrayNode.class));

        //System.out.println(node.toPrettyString());

        return node;
    }

    @SneakyThrows
    public JsonNode handleMethods(String className, String methodName, List<String> params) {
        Method method;

        if (methodName.matches(".*(?i)reply.*")) {
            method = Class.forName(className).getMethod(methodName, String.class);
        } else {
            if (params.isEmpty()) {
                method = Class.forName(className).getMethod(methodName);
            } else {
                method = Class.forName(className).getMethod(methodName, params.stream().map(p -> {
                    try {
                        return Class.forName(p);
                    } catch (ClassNotFoundException e) {
                        throw new RuntimeException(e);
                    }
                }).toArray(Class[]::new));
            }
        }

        Class<?> returnType = method.getReturnType();
        if (returnType.getPackage() != null) {
            if (List.class.isAssignableFrom(returnType)) {
                return handleList(method);
            }
            if (returnType.getPackage().getName().startsWith("io.github.dawncord.api")) {
                return handleEvent(returnType);
            }
        }

        return null;
    }

    private JsonNode handleList(Method method) {
        Type returnType = method.getGenericReturnType();

        if (returnType instanceof ParameterizedType parameterizedType) {
            Type[] typeArguments = parameterizedType.getActualTypeArguments();
            Type listType = typeArguments[0];
            Class<?> genericType = (Class<?>) listType;

            if (genericType.getPackage().getName().startsWith("io.github.dawncord.api")) {
                return handleEvent(genericType);
            }
        }

        return null;
    }

    public void removeSlash(String commandName) {
        commandName = commandName.replace("_", " ");
        EventProcessor.slashCommandEventHandlers.remove(commandName);
    }

    public void removeComponent(String eventType, String componentId) {
        switch (eventType) {
            case "button" -> EventProcessor.buttonEventHandlers.remove(componentId);
            case "select" -> EventProcessor.selectMenuEventHandlers.remove(componentId);
            case "modal" -> EventProcessor.modalSubmitEventHandlers.remove(componentId);
        }
    }
}
