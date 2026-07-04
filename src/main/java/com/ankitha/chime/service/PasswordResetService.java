package com.ankitha.chime.service;

import com.ankitha.chime.dto.request.ForgotPasswordRequest;
import com.ankitha.chime.dto.request.ResetPasswordRequest;
import com.ankitha.chime.entity.PasswordResetToken;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.exception.AppException;
import com.ankitha.chime.repository.PasswordResetTokenRepository;
import com.ankitha.chime.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        // Always return success — never reveal whether the email exists
        if (userOpt.isEmpty()) {
            log.info("Forgot password requested for unknown email: {}", request.getEmail());
            return;
        }

        User user = userOpt.get();

        // Delete any previous unused tokens for this user
        tokenRepository.deleteAllByUserId(user.getId());

        String otp = generateOtp();
        String tokenHash = hash(otp);

        PasswordResetToken token = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .used(false)
                .build();

        tokenRepository.save(token);
        emailService.sendPasswordResetOtp(user.getEmail(), otp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("Invalid or expired code", HttpStatus.BAD_REQUEST));

        String tokenHash = hash(request.getOtp());

        PasswordResetToken token = tokenRepository.findValidByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException("Invalid or expired code", HttpStatus.BAD_REQUEST));

        if (!token.getUser().getId().equals(user.getId())) {
            throw new AppException("Invalid or expired code", HttpStatus.BAD_REQUEST);
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException("Code has expired — request a new one", HttpStatus.BAD_REQUEST);
        }

        token.setUsed(true);
        tokenRepository.save(token);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password reset successfully for user {}", user.getEmail());
    }

    // ── helpers ──────────────────────────────────────────────

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100_000 + random.nextInt(900_000);
        return String.valueOf(otp);
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
