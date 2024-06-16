package io.github.dawncord.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.dawncord.api.Dawncord;
import io.github.dawncord.api.event.SlashCommandEvent;
import io.github.dawncord.server.controller.HandlerController;
import io.github.dawncord.server.service.BotService;
import io.github.dawncord.server.service.HandlerService;
import io.github.dawncord.server.utils.Constants;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.*;
import java.util.function.Consumer;

@SpringBootApplication
public class ServerApplication {
    public static void main(String[] args) {
        clearLogFileContent();

        SpringApplication.run(ServerApplication.class, args);
    }

    private static void clearLogFileContent() {
        try {
            createLogFile();
            PrintWriter writer = new PrintWriter(new FileWriter(Constants.LOG_FILE_PATH, false));
            writer.print("");
            writer.close();
        } catch (IOException e) {
            System.err.println("Failed to clear log file content: " + e.getMessage());
        }
    }

    private static void createLogFile() throws IOException {
        File logFile = new File("logs/server.log");
        if (!logFile.exists()) {
            logFile.createNewFile();
        }
        Constants.LOG_FILE_PATH = logFile.getPath();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NotNull CorsRegistry registry) {
                registry.addMapping("/bot/**").allowedOrigins("http://localhost:3000");
            }
        };
    }
}
