package com.tesoob.store.security;

import com.tesoob.store.domain.*;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Operator-controlled provisioning only: never accepts roles through public signup. */
@Component
public class AdminBootstrap implements ApplicationRunner {
    private final UserRepository users;
    private final String email;
    private final String hash;
    public AdminBootstrap(UserRepository users, @Value("${store.bootstrap.email:}") String email,
        @Value("${store.bootstrap.password-hash:}") String hash) { this.users = users; this.email = email; this.hash = hash; }
    @Override @Transactional public void run(ApplicationArguments args) {
        if (email.isBlank() && hash.isBlank()) return;
        if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || !hash.matches("\\$2[aby]\\$(1[2-6])\\$[./A-Za-z0-9]{53}"))
            throw new IllegalStateException("Admin requires an email and BCrypt hash (cost 12–16)");
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        var existing = users.findByEmail(normalized);
        if (existing.isPresent()) {
            if (!existing.get().role.equals("ADMIN")) throw new IllegalStateException("Bootstrap will not promote an existing customer");
            return;
        }
        var admin = new StoreUser(); admin.email = normalized; admin.passwordHash = hash; admin.role = "ADMIN";
        users.save(admin);
    }
}
