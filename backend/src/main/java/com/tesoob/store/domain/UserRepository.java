package com.tesoob.store.domain;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<StoreUser, UUID> {
    Optional<StoreUser> findByEmail(String email);
    Optional<StoreUser> findByGoogleId(String googleId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from StoreUser u where u.id = :id")
    Optional<StoreUser> lockById(@Param("id") UUID id);
}
