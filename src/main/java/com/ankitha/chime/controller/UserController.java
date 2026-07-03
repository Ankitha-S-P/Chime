package com.ankitha.chime.controller;

import com.ankitha.chime.dto.response.UserResponse;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(toResponse(user));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> search(
            @RequestParam String query,
            @AuthenticationPrincipal User currentUser) {
        List<UserResponse> results = userRepository
                .searchByUsername(query, currentUser.getId(), PageRequest.of(0, 10))
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(results);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
