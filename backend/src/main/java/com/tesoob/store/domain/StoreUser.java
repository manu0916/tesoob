package com.tesoob.store.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "users")
public class StoreUser {
    @Id public UUID id = UUID.randomUUID();
    @Column(nullable = false, unique = true, length = 254) public String email;
    @Column(name = "password_hash", length = 100) public String passwordHash;
    @Column(name = "google_id", unique = true) public String googleId;
    @Column(nullable = false, length = 16) public String role = "CUSTOMER";
    @Column(nullable = false) public boolean enabled = true;
    @Column(name = "created_at", nullable = false, updatable = false) public Instant createdAt = Instant.now();
}
