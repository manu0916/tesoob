package com.tesoob.store.security;

import com.tesoob.store.domain.*;
import com.tesoob.store.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUser {
    private final UserRepository users;
    public CurrentUser(UserRepository users) { this.users = users; }
    public StoreUser require() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Entre na sua conta.");
        return users.findByEmail(auth.getName()).filter(u -> u.enabled)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Entre na sua conta."));
    }
    public void requireAdmin() {
        if (!"ADMIN".equals(require().role)) throw new ApiException(HttpStatus.FORBIDDEN, "Acesso restrito ao administrador.");
    }
}
