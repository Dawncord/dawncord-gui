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
import io.github.dawncord.server.payload.handler.BaseHandlerResponse;
import io.github.dawncord.server.payload.handler.ComponentHandlerResponse;
import io.github.dawncord.server.payload.handler.SlashHandlerResponse;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.*;
import java.util.function.Consumer;

@Service
public class HandlerService {
    private final BotService botService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public HandlerService(BotService botService) {
        this.botService = botService;
    }

    public void processResponse(JsonNode jsonNode, String eventType) {
        switch (eventType) {
            case "slash" -> processSlash(jsonNode);
            case "button", "select", "modal" -> processComponent(jsonNode, eventType);
        }
    }

    @SneakyThrows
    private void processSlash(JsonNode jsonNode) {
        SlashHandlerResponse response = mapper.treeToValue(jsonNode, SlashHandlerResponse.class);
        List<String> list = extractMethodNames(response);
        List<String> replyList = extractReplyMethodNames(response);

        processSlashEvent(response.getCommandName(), list, replyList);
    }

    @SneakyThrows
    private void processComponent(JsonNode jsonNode, String eventType) {
        ComponentHandlerResponse response = mapper.treeToValue(jsonNode, ComponentHandlerResponse.class);
        List<String> list = extractMethodNames(response);
        List<String> replyList = extractReplyMethodNames(response);

        processComponentEvent(response.getComponentId(), list, replyList, eventType);
    }

    private <T extends BaseHandlerResponse<T>> List<String> extractMethodNames(T response) {
        List<String> list = new ArrayList<>();
        list.add(response.getMethodName());

        T current = response;
        while (current.getNext() != null) {
            current = current.getNext();
            list.add(current.getMethodName());
        }

        return list;
    }

    private <T extends BaseHandlerResponse<T>> List<String> extractReplyMethodNames(T response) {
        List<String> replyList = new ArrayList<>();

        if (response.getMethodName().equals("reply")) {
            T current = response.getChild();
            replyList.add(current.getMethodName());

            while (current.getNext() != null) {
                current = current.getNext();
                replyList.add(current.getMethodName());
            }
        }

        return replyList;
    }

    private void processSlashEvent(String commandName, List<String> list, List<String> replyList) {
        botService.getBot().onSlashCommand(commandName, onEvent(SlashCommandEvent.class, list, replyList));
    }

    private void processComponentEvent(String componentId, List<String> list, List<String> replyList, String eventType) {
        switch (eventType) {
            case "button" -> botService.getBot().onButton(componentId, onEvent(ButtonEvent.class, list, replyList));
            case "select" -> botService.getBot().onSelectMenu(componentId, onEvent(SelectMenuEvent.class, list, replyList));
            case "modal" -> botService.getBot().onModal(componentId, onEvent(ModalSubmitEvent.class, list, replyList));
        }
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
        List<Method> methods = Arrays.stream(currentClass.getMethods()).toList();

        ObjectNode node = mapper.createObjectNode();
        ArrayNode methodsNode = mapper.createArrayNode();

        methods.forEach(method -> {
            methodsNode.add(mapper.createObjectNode()
                    .put("name", method.getName())
                    .put("class", method.getReturnType().getName())
            );
        });

        node.put("current", currentClass.getName());
        node.set("methods", methodsNode);

        return node;
    }

    @SneakyThrows
    public JsonNode handleMethods(String className, String methodName) {
        Method method;

        if (methodName.equals("reply")) {
            method = Class.forName(className).getMethod(methodName, String.class);
        } else {
            method = Class.forName(className).getMethod(methodName);
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
