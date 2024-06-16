package io.github.dawncord.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.dawncord.api.event.SlashCommandEvent;
import io.github.dawncord.api.types.GatewayIntent;
import io.github.dawncord.server.payload.slash.SlashHandlerResponse;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

@Service
public class HandlerService {
    private final BotService botService;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public HandlerService(BotService botService) {
        this.botService = botService;
    }

    @SneakyThrows
    public void processResponse(JsonNode jsonNode) {
        SlashHandlerResponse response = mapper.treeToValue(jsonNode, SlashHandlerResponse.class);

        String commandName = response.getCommandName();

        List<String> list = new ArrayList<>();
        list.add(response.getMethodName());

        SlashHandlerResponse current = response;
        while (current.getNext() != null) {
            current = current.getNext();
            list.add(current.getMethodName());
        }

        List<String> replyList = new ArrayList<>();

        if(list.get(0).equals("reply")) {
            replyList.add(current.getChild().getMethodName());

            SlashHandlerResponse reply = current.getChild();
            while (reply.getNext() != null) {
                reply = reply.getNext();
                replyList.add(reply.getMethodName());
            }
        }

        processEvent(commandName, list, replyList);
    }

    private void processEvent(String commandName, List<String> list, List<String> replyList) {
        botService.getBot().onSlashCommand(commandName, event -> {
            try {
                Method eventMethod;
                if (list.get(0).equals("reply")) {
                    eventMethod = SlashCommandEvent.class.getMethod(list.get(0), String.class);

                    Method method = SlashCommandEvent.class.getMethod(replyList.get(0));
                    Object object = method.invoke(event);

                    for (int i = 1; i < replyList.size(); i++) {
                        method = object.getClass().getMethod(replyList.get(i));
                        object = method.invoke(object);
                    }

                    eventMethod.invoke(event, object.toString());
                } else {
                    eventMethod = SlashCommandEvent.class.getMethod(list.get(0));
                    Object object = eventMethod.invoke(event);

                    for (int i = 1; i < list.size(); i++) {
                        Method method = object.getClass().getMethod(list.get(i));
                        object = method.invoke(object);
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
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

    public JsonNode handleMethods(String className, String methodName) {
        try {
            Method method;
            if (methodName.equals("reply")) {
                method = Class.forName(className).getMethod(methodName, String.class);
            } else if (methodName.equals("then")) {
                method = Class.forName(className).getMethod("then", Consumer.class);
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
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Введен некорректный номер метода");
        } catch (ClassNotFoundException | NoSuchMethodException e) {
            throw new RuntimeException(e);
        }
        return null;
    }

    private JsonNode handleList(Method method) {
        try {
            Type returnType = method.getGenericReturnType();

            if (returnType instanceof ParameterizedType parameterizedType) {
                Type[] typeArguments = parameterizedType.getActualTypeArguments();
                Type listType = typeArguments[0];
                Class<?> genericType = (Class<?>) listType;

                if (genericType.getPackage().getName().startsWith("io.github.dawncord.api")) {
                    return handleEvent(genericType);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
