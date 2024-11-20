package io.github.dawncord.server.controller;

import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.JsonNode;
import io.github.dawncord.api.event.ButtonEvent;
import io.github.dawncord.api.event.ModalSubmitEvent;
import io.github.dawncord.api.event.SelectMenuEvent;
import io.github.dawncord.api.event.SlashCommandEvent;
import io.github.dawncord.server.payload.handler.HandlerRequest;
import io.github.dawncord.server.service.HandlerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public JsonNode methods(@RequestParam String className, @RequestParam String methodName, @RequestParam(required = false) List<String> params) {
        return handlerService.handleMethods(className, methodName, params);
    }

    /*@PostMapping("/slash/{commandName}/execute")
    public String executeSlash(@RequestBody JsonNode jsonNode, @PathVariable String commandName) {
        System.out.println(commandName);
        System.out.println(jsonNode.toPrettyString());
        System.out.println("------------------");
        return null;
    }*/

    @PostMapping("/slash/{commandName}/execute")
    public String executeSlash(@RequestBody HandlerRequest request, @PathVariable String commandName) {
        handlerService.processSlash(request, commandName);
        return null;
    }

    @PostMapping("/component/{eventType}/{componentId}/execute")
    public String executeComponent(@RequestBody HandlerRequest request, @PathVariable String eventType, @PathVariable String componentId) {
        handlerService.processComponent(request, eventType, componentId);
        return null;
    }

    @PostMapping("/slash/{commandName}/remove")
    public String removeSlash(@PathVariable String commandName) {
        handlerService.removeSlash(commandName);
        return null;
    }

    @PostMapping("/component/{eventType}/{componentId}/remove")
    public String removeComponent(@PathVariable String eventType, @PathVariable String componentId) {
        handlerService.removeComponent(eventType, componentId);
        return null;
    }
}

