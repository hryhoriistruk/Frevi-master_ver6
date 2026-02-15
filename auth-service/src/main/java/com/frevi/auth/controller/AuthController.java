package com.frevi.auth.controller;

import com.frevi.auth.request.SignInRequest;
import com.frevi.auth.request.SignUpRequest;
import com.frevi.auth.response.SignUpResponse;
import com.frevi.auth.service.AuthService;
import lombok.AllArgsConstructor;
import org.keycloak.representations.AccessTokenResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@AllArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signUp")
    public ResponseEntity<SignUpResponse> signUp(@RequestBody SignUpRequest signUpRequest) {
        SignUpResponse response = authService.registerUser(signUpRequest);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signIn")
    public ResponseEntity<AccessTokenResponse> signIn(@RequestBody SignInRequest signInRequest) {
        AccessTokenResponse response = authService.authenticateUser(signInRequest);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh/{userId}")
    public ResponseEntity<AccessTokenResponse> refreshToken(@PathVariable String userId) {
        AccessTokenResponse response = authService.refreshToken(userId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout/{userId}")
    public ResponseEntity<Void> signOut(@PathVariable String userId) {
        authService.logout(userId);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId) {
        authService.deleteUser(userId);

        return ResponseEntity.ok().build();
    }
}
