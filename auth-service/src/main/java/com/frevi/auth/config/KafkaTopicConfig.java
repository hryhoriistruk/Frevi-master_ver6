package com.frevi.auth.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaTopicConfig {
    private NewTopic createTopic(String name) {
        return new NewTopic(name, 3, (short) 1);
    }

    @Bean
    public NewTopic userRegistrationTopic() {
        return createTopic("user-registration");
    }

    @Bean
    public NewTopic userDeletionTopic() {
        return createTopic("user-deletion");
    }

    @Bean
    public NewTopic userSavingTopic() {
        return createTopic("user-saving");
    }
}
