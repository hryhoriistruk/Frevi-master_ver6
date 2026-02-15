package com.frevi.auth.mapper;

import com.frevi.auth.request.SignUpRequest;
import com.frevi.auth.response.SignUpResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuthMapper {
    SignUpResponse toResponse(SignUpRequest signUpRequest);
}
