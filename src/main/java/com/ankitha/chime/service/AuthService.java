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
import com.ankitha.chime.exception.AppException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuditService auditService;

    @Value("${app.jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email already in use", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Username already taken", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .active(true)
                .build();

        user = userRepository.save(user);
        auditService.log("USER_REGISTER", "USER", user.getId(), user,
                Map.of("email", user.getEmail(), "username", user.getUsername()));
        return buildAuthResponse(user, null);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("Invalid credentials", HttpStatus.BAD_REQUEST));

        if (!user.isActive()) {
            throw new AppException("Account is disabled", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Invalid credentials", HttpStatus.BAD_REQUEST);
        }

        String deviceInfo = httpRequest.getHeader("User-Agent");
        auditService.log("USER_LOGIN", "USER", user.getId(), user,
                Map.of("email", user.getEmail()));
        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenHash = jwtUtil.hashToken(request.getRefreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (stored.isRevoked()) {
            throw new AppException("Refresh token has been revoked", HttpStatus.UNAUTHORIZED);
        }

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Refresh token has expired", HttpStatus.UNAUTHORIZED);
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