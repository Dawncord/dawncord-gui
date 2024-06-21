package io.github.dawncord.server.controller;

import io.github.dawncord.server.payload.bot.BotRequest;
import io.github.dawncord.server.service.BotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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