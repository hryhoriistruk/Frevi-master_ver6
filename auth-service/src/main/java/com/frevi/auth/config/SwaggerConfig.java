package com.frevi.auth.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "auth-service",
                version = "v1",
                description = "Responsible for authentication and registration."
        )
)
public class SwaggerConfig {
}
