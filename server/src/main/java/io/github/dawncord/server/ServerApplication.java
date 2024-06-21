package io.github.dawncord.server;

import io.github.dawncord.server.utils.Constants;
import org.jetbrains.annotations.NotNull;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

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
