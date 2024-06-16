package io.github.dawncord.server.controller;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.dawncord.api.event.SlashCommandEvent;
import io.github.dawncord.server.service.HandlerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

    @GetMapping("/methods")
    public JsonNode methods(@RequestParam String className, @RequestParam String methodName) {
        return handlerService.handleMethods(className, methodName);
    }

    @PostMapping("/execute")
    public String execute(@RequestBody JsonNode json){
        handlerService.processResponse(json);

        return null;
    }
}

