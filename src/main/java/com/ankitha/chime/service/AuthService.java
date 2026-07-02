package com.ankitha.chime.service;

import com.ankitha.chime.dto.request.LoginRequest;
import com.ankitha.chime.dto.request.LogoutRequest;
import com.ankitha.chime.dto.request.RefreshTokenRequest;
import com.ankitha.chime.dto.request.RegisterRequest;
import com.ankitha.chime.dto.response.AuthResponse;
import com.ankitha.chime.dto.response.UserResponse;
import com.ankitha.chime.entity.RefreshToken;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.repository.RefreshTokenRepository;
import com.ankitha.chime.repository.UserRepository;
import com.ankitha.chime.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .build();

        user = userRepository.save(user);

        return buildAuthResponse(user, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String deviceInfo = httpRequest.getHeader("User-Agent");
        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenHash = jwtUtil.hashToken(request.getRefreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (stored.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token has expired");
        }

        // Token rotation: delete old token, issue new one
        refreshTokenRepository.delete(stored);

        return buildAuthResponse(stored.getUser(), null);
    }

    @Transactional
    public void logout(LogoutRequest request, String accessToken) {
        // 1. Blacklist the access token in Redis
        if (accessToken != null && jwtUtil.isTokenValid(accessToken)) {
            long remainingTtl = jwtUtil.getExpirationFromToken(accessToken)
                    - System.currentTimeMillis();
            if (remainingTtl > 0) {
                tokenBlacklistService.blacklist(accessToken, remainingTtl);
            }
        }

        // 2. Delete the refresh token from DB
        String tokenHash = jwtUtil.hashToken(request.getRefreshToken());
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(User user, String deviceInfo) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());

        String rawRefreshToken = jwtUtil.generateRefreshToken();
        String tokenHash = jwtUtil.hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .isRevoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .user(toUserResponse(user))
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}