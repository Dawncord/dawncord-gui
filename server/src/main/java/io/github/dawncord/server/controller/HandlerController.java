package io.github.dawncord.server.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.dawncord.api.event.ButtonEvent;
import io.github.dawncord.api.event.ModalSubmitEvent;
import io.github.dawncord.api.event.SelectMenuEvent;
import io.github.dawncord.api.event.SlashCommandEvent;
import io.github.dawncord.server.service.HandlerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bot/handlers")
public class HandlerController {
    private final HandlerService handlerService;

    @Autowired
    public HandlerController(HandlerService handlerService) {
        this.handlerService = handlerService;
    }

    @GetMapping("/slash")
    public JsonNode slash() {
        return handlerService.handleEvent(SlashCommandEvent.class);
    }

    @GetMapping("/component")
    public JsonNode component(@RequestParam String eventType) {
        return switch (eventType) {
            case "button" -> handlerService.handleEvent(ButtonEvent.class);
            case "select" -> handlerService.handleEvent(SelectMenuEvent.class);
            case "modal" -> handlerService.handleEvent(ModalSubmitEvent.class);
            default -> throw new IllegalStateException("Unexpected value: " + eventType);
        };
    }

    @GetMapping("/methods")
    public JsonNode methods(@RequestParam String className, @RequestParam String methodName) {
        return handlerService.handleMethods(className, methodName);
    }

    @PostMapping("/execute")
    public String execute(@RequestBody JsonNode json, @RequestParam String eventType) {
        handlerService.processResponse(json, eventType);
        return null;
    }

    @PostMapping("/slash/remove")
    public String removeSlash(@RequestBody JsonNode data) {
        String commandName = data.get("commandName").asText();
        handlerService.removeSlash(commandName);
        return null;
    }

    @PostMapping("/component/remove")
    public String removeComponent(@RequestBody JsonNode data) {
        String eventType = data.get("eventType").asText();
        String componentId = data.get("componentId").asText();
        handlerService.removeComponent(eventType, componentId);
        return null;
    }
}

