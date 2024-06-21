package io.github.dawncord.server.service;

import io.github.dawncord.api.Dawncord;
import io.github.dawncord.api.types.GatewayIntent;
import io.github.dawncord.server.utils.Constants;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class BotService {
    private Dawncord bot;

    public void startBot(String token, List<String> intents) {
        bot = new Dawncord(token);
        bot.setIntents(intents.stream().map(GatewayIntent::valueOf).toArray(GatewayIntent[]::new));
        bot.start();
    }

    public void stopBot() {
        bot.stop();
        bot = null;
    }

    public Dawncord getBot() {
        return bot;
    }

    public String getLogs() {
        byte[] logBytes;
        try {
            logBytes = Files.readAllBytes(Paths.get(Constants.LOG_FILE_PATH));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return new String(logBytes, Charset.defaultCharset());
    }

    public void clearLogs() {
        Path logFilePath = Paths.get(Constants.LOG_FILE_PATH);

        try {
            if (Files.exists(logFilePath)) {
                Files.write(logFilePath, new byte[0]);
            } else {
                Files.createFile(logFilePath);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
