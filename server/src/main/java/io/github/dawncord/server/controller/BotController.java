package io.github.dawncord.server.controller;

import io.github.dawncord.server.payload.bot.BotRequest;
import io.github.dawncord.server.service.BotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/bot")
public class BotController {
    private final BotService botService;

    @Autowired
    public BotController(BotService botService) {
        this.botService = botService;
    }

    @PostMapping("/start")
    public String create(@RequestBody BotRequest botRequest) {
        String token = botRequest.getToken();
        List<String> intents = botRequest.getIntents();

        botService.clearLogs();
        botService.startBot(token, intents);

        return null;
    }

    @PostMapping("/stop")
    public String stop() {
        botService.stopBot();

        return null;
    }
}