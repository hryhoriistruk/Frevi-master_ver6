package com.frevi.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class GatewayConfig {
    private static final String FALLBACK_URL = "forward:/fallbackRoute";

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user_service",
                        r -> r.path("/api/v1/users/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("userServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://USER-SERVICE")
                )
                .route("messenger_service",
                        r -> r.path("/api/v1/messenger/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("messengerServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://messengerService")
                )
                .route("messages_service",
                        r -> r.path("/api/v1/messages/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("messagesServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://messaging-service")
                )
                .route("chat_service",
                        r -> r.path("/api/v1/chat/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("chatServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://messaging-service")
                )
                .route("order",
                        r -> r.path("/api/v1/orders/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("orderServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://orderService")
                )
                .route("assistance_service",
                        r -> r.path("/api/v1/assistance/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("assistanceServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://assistanceService")
                )
                .route("payment_service",
                        r -> r.path("/api/v1/payment/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("paymentServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://paymentService")
                )
                .route("admin_service",
                        r -> r.path("/api/v1/admin/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("adminServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://adminService")
                )
                .route("analytics_service",
                        r -> r.path("/api/v1/analytics/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("analyticsServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://analyticsService")
                )
                .route("notification_service",
                        r -> r.path("/api/v1/notify/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("notificationServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("http://localhost:8083")
                )
                .route("auth_service",
                        r -> r.path("/api/v1/auth/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("authServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://auth-service")
                )
                .route("posts_service",
                        r -> r.path("/api/v1/posts/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("postsServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://posts-service")
                )
                .route("friends_service",
                        r -> r.path("/api/v1/friends/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("friendsServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://friends-service")
                )
                .route("announcement_service",
                        r -> r.path("/api/v1/announcements/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("announcementServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://announcement-service")
                )
                .route("messaging_service",
                        r -> r.path("/api/v1/messaging/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("messagingServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://messaging-service")
                )
                .route("ads_service",
                        r -> r.path("/api/v1/ads/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("adsServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("lb://ads-service")
                )
                .route("config_service",
                        r -> r.path("/api/v1/config/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("configServiceCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("http://localhost:8888")
                )
                .route("service_registry",
                        r -> r.path("/api/v1/registry/**")
                                .filters(
                                        f ->
                                                f.circuitBreaker(c ->
                                                        c.setName("serviceRegistryCB")
                                                                .setFallbackUri(FALLBACK_URL))
                                ).uri("http://localhost:8761")
                )
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> fallbackHandle() {
        return RouterFunctions
                .route()
                .GET("/fallback", request
                        -> ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                .bodyValue(FALLBACK_URL))
                .build();

    }
}
