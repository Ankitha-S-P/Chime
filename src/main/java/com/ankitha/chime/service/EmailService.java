package com.ankitha.chime.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetOtp(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Chime — Your password reset code");
            message.setText(
                    "Your Chime password reset code is:\n\n" +
                    "  " + otp + "\n\n" +
                    "This code expires in 10 minutes.\n" +
                    "If you did not request this, you can safely ignore this email."
            );
            mailSender.send(message);
            log.info("Password reset OTP sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw e;
        }
    }
}
