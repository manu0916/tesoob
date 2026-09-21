package com.tesoob.store.security;

import com.github.benmanes.caffeine.cache.*;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;

/** Per-instance abuse protection. Configure edge rate limiting for multiple replicas. */
public class AuthRateLimit extends OncePerRequestFilter {
    private final Cache<String, AtomicInteger> attempts = Caffeine.newBuilder()
        .maximumSize(10000).expireAfterWrite(Duration.ofMinutes(1)).build();
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String path = req.getServletPath();
        if (req.getMethod().equals("POST") && (path.equals("/auth/login") || path.equals("/auth/register"))) {
            if (attempts.get(req.getRemoteAddr(), k -> new AtomicInteger()).incrementAndGet() > 15) {
                res.setStatus(429); res.setHeader("Retry-After", "60"); res.setContentType("application/json;charset=UTF-8");
                res.getWriter().write("{\"message\":\"Muitas tentativas. Aguarde um minuto.\"}"); return;
            }
        }
        chain.doFilter(req, res);
    }
}
