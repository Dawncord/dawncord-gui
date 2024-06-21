package io.github.dawncord.server.controller;

import io.github.dawncord.server.service.BotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bot/logs")
public class LogsController {
    private final BotService botService;

    @Autowired
    public LogsController(BotService botService) {
        this.botService = botService;
    }

    @GetMapping
    public String getLogs() {
        return botService.getLogs();
    }
}
