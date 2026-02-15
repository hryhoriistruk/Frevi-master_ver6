package com.frevi.auth.token;

import org.keycloak.representations.AccessTokenResponse;

import java.time.Duration;

public record AuthToken(String userId,
                        AccessTokenResponse accessTokenResponse,
                        Duration expiresIn) {
}
