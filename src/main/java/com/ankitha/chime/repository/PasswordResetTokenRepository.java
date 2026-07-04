package com.ankitha.chime.repository;

import com.ankitha.chime.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    @Query("SELECT t FROM PasswordResetToken t JOIN FETCH t.user WHERE t.tokenHash = :tokenHash AND t.used = false")
    Optional<PasswordResetToken> findValidByTokenHash(String tokenHash);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user.id = :userId")
    void deleteAllByUserId(UUID userId);
}
