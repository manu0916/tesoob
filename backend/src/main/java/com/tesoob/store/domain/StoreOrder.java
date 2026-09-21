package com.tesoob.store.domain;

import com.tesoob.store.crypto.EncryptedStringConverter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "orders", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "idempotency_key"}))
public class StoreOrder {
    @Id public UUID id = UUID.randomUUID();
    @Column(name = "user_id", nullable = false) public UUID userId;
    @Column(name = "product_id", nullable = false) public UUID productId;
    @Column(name = "product_name", nullable = false, length = 140) public String productName;
    @Column(nullable = false) public int quantity;
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2) public BigDecimal unitPrice;
    @Column(nullable = false, precision = 14, scale = 2) public BigDecimal total;
    @Column(nullable = false, length = 3) public String currency = "BRL";
    @Column(nullable = false, length = 32) public String status = "AWAITING_INTEGRATION";
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "checkout_ciphertext", nullable = false, columnDefinition = "text") public String checkoutJson;
    @Column(name = "idempotency_key", nullable = false) public UUID idempotencyKey;
    @Version public long version;
    @Column(name = "created_at", nullable = false, updatable = false) public Instant createdAt = Instant.now();
}
