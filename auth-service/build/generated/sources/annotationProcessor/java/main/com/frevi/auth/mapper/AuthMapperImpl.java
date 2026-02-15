package com.frevi.auth.mapper;

import com.frevi.auth.request.SignUpRequest;
import com.frevi.auth.response.SignUpResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-15T01:07:39+0200",
    comments = "version: 1.5.5.Final, compiler: IncrementalProcessingEnvironment from gradle-language-java-8.14.3.jar, environment: Java 17.0.18 (Amazon.com Inc.)"
)
@Component
public class AuthMapperImpl implements AuthMapper {

    @Override
    public SignUpResponse toResponse(SignUpRequest signUpRequest) {
        if ( signUpRequest == null ) {
            return null;
        }

        String email = null;

        email = signUpRequest.email();

        Long userId = null;
        String username = null;

        SignUpResponse signUpResponse = new SignUpResponse( userId, username, email );

        return signUpResponse;
    }
}
