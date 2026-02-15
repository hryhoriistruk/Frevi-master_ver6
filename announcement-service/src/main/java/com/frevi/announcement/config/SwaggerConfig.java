package com.frevi.announcement.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "announcement-service",
                version = "v1",
                description = "Responsible for announcement logic and their crud operations."
        )
)
public class SwaggerConfig {
}
