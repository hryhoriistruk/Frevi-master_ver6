package com.frevi.auth.service;

import com.frevi.auth.event.UserDeletionEvent;
import com.frevi.auth.event.UserRegistrationEvent;
import com.frevi.auth.exception.CacheException;
import com.frevi.auth.exception.EntityNotFoundException;
import com.frevi.auth.exception.UserDeletingException;
import com.frevi.auth.mapper.AuthMapper;
import com.frevi.auth.request.SignInRequest;
import com.frevi.auth.request.SignUpRequest;
import com.frevi.auth.response.SignUpResponse;
import javax.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final Keycloak keycloakAdminClient;
    private final AuthMapper authMapper;
    private final KafkaTemplate<String, UserRegistrationEvent> registrationEventKafkaTemplate;
    private final KafkaTemplate<String, UserDeletionEvent> deletionEventKafkaTemplate;
    private final CacheManager cacheManager;

    @Value("${keycloak.realm}")
    private String keycloakRealm;

    @Value("${keycloak.auth-server-url}")
    private String keycloakAuthServerUrl;

    @Value("${keycloak.credentials.client-id}")
    private String keycloakClientId;

    @Value("${keycloak.credentials.secret}")
    private String keycloakClientSecret;

    private AccessTokenResponse getCachedToken(String userId) {
        Cache cache = cacheManager.getCache("token");

        if (cache != null) {
            return cache.get(userId, AccessTokenResponse.class);
        }

        return null;
    }

    private AccessTokenResponse getNewToken(Keycloak keycloak) {
        return keycloak.tokenManager().getAccessToken();
    }

    private AccessTokenResponse getRefreshedToken(String userId) throws EntityNotFoundException {
        AccessTokenResponse accessToken = getCachedToken(userId);

        if (accessToken == null) {
            throw new EntityNotFoundException();
        }

        Keycloak keycloak = Keycloak.getInstance(
                keycloakAuthServerUrl,
                keycloakRealm,
                keycloakClientId,
                accessToken.getRefreshToken(),
                keycloakClientSecret
        );

        return getNewToken(keycloak);
    }

    private void handleResponseCode(Response response) throws UserDeletingException {
        int responseCode = response.getStatus();

        if (responseCode > 299) {
            throw new UserDeletingException(HttpStatus.valueOf(responseCode));
        }
    }

    public String createKeycloakUser(UserRepresentation user, UsersResource usersResource) {
        String userId = "";

        try(Response response = usersResource.create(user)) {
            handleResponseCode(response);

            userId = response.getLocation().getPath();
        } finally {
            userId = userId.replaceAll(".*/([^/]+)$", "$1");
        }

        return userId;
    }

    public SignUpResponse registerUser(SignUpRequest request) {
        RealmResource realmResource = keycloakAdminClient.realm(keycloakRealm);

        UsersResource usersResource = realmResource.users();

        UserRepresentation user = new UserRepresentation();

        user.setUsername(request.email());

        user.setEmail(request.email());

        user.setFirstName(request.name());

        user.setLastName(request.surname());

        user.setEnabled(true);

        String userId = createKeycloakUser(user, usersResource);

        CredentialRepresentation credentialRepresentation = new CredentialRepresentation();

        credentialRepresentation.setType(CredentialRepresentation.PASSWORD);

        credentialRepresentation.setValue(request.password());

        realmResource.users().get(userId).resetPassword(credentialRepresentation);

        registrationEventKafkaTemplate.send("user-registration", new UserRegistrationEvent(userId,
                request.email(), request.password()));

        return authMapper.toResponse(request);
    }

    public AccessTokenResponse authenticateUser(SignInRequest request) throws CacheException {
        String userId = keycloakAdminClient.realm(keycloakRealm)
                .users()
                .search(request.email())
                .stream()
                .filter(user -> user.getUsername().equals(request.email()))
                .map(UserRepresentation::getId)
                .findFirst()
                .orElseThrow(EntityNotFoundException::new);

        Keycloak keycloak = Keycloak.getInstance(
                keycloakAuthServerUrl,
                keycloakRealm,
                keycloakClientId,
                request.email(),
                request.password(),
                keycloakClientSecret
        );

        AccessTokenResponse accessToken = getNewToken(keycloak);

        Cache cache = cacheManager.getCache("token");

        if (cache == null) {
            throw new CacheException();
        }

        cache.put(String.valueOf(userId), accessToken);

        return accessToken;
    }

    @Cacheable(value = "token", key = "#userId")
    public AccessTokenResponse refreshToken(String userId) {
        return getRefreshedToken(userId);
    }

    @CacheEvict(value = "token", key = "#userId")
    public void logout(String userId) {
        keycloakAdminClient.realm(keycloakRealm).users().get(String.valueOf(userId)).logout();
    }

    public void deleteUser(String userId) throws UserDeletingException {
        try(Response response = keycloakAdminClient
                .realm(keycloakRealm).users().delete(String.valueOf(userId))) {

                handleResponseCode(response);
        } finally {
            deletionEventKafkaTemplate.send("user-deletion", new UserDeletionEvent(userId));
        }
    }
}
