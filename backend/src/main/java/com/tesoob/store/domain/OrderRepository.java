package com.tesoob.store.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<StoreOrder, UUID> {
    Optional<StoreOrder> findByUserIdAndIdempotencyKey(UUID userId, UUID key);
    Optional<StoreOrder> findByIdAndUserId(UUID id, UUID userId);
    Page<StoreOrder> findByUserId(UUID userId, Pageable pageable);
}
