package com.tesoob.store.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "products")
public class Product {
    @Id public UUID id = UUID.randomUUID();
    @Column(nullable = false, length = 140) public String name;
    @Column(nullable = false, precision = 12, scale = 2) public BigDecimal price;
    @Column(name = "image_url", nullable = false, length = 2048) public String imageUrl;
    @Column(nullable = false, columnDefinition = "text") public String description;
    @Column(columnDefinition = "text") public String observation;
    @Column(nullable = false) public boolean active = true;
    @Version public long version;
    @Column(name = "created_at", nullable = false, updatable = false) public Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) public Instant updatedAt = Instant.now();
    @PreUpdate void updated() { updatedAt = Instant.now(); }
}
