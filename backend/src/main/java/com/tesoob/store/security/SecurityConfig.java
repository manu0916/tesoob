package com.tesoob.store.security;

import com.tesoob.store.domain.*;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwords() { return new BCryptPasswordEncoder(12); }
    @Bean UserDetailsService userDetails(UserRepository users) {
        return email -> users.findByEmail(email).filter(u -> u.passwordHash != null)
            .map(u -> User.withUsername(u.email).password(u.passwordHash).roles(u.role).disabled(!u.enabled).build())
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
    @Bean AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder encoder) {
        var provider = new DaoAuthenticationProvider(users); provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
    @Bean SecurityContextRepository contexts() { return new HttpSessionSecurityContextRepository(); }
    @Bean SecurityFilterChain chain(HttpSecurity http, SecurityContextRepository contexts,
        ObjectProvider<ClientRegistrationRepository> registrations, GoogleUserService google, UserRepository users) throws Exception {
        http.securityContext(c -> c.securityContextRepository(contexts));
        // Token is returned by GET /auth/csrf; session cookie stays HttpOnly.
        http.csrf(c -> c.csrfTokenRepository(new HttpSessionCsrfTokenRepository()));
        http.requestCache(c -> c.disable());
        http.authorizeHttpRequests(a -> a
            .requestMatchers(HttpMethod.GET, "/products", "/products/*", "/auth/csrf", "/auth/options").permitAll()
            .requestMatchers("/auth/login", "/auth/register", "/oauth2/**", "/login/oauth2/**", "/error").permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated());
        http.exceptionHandling(e -> e
            .authenticationEntryPoint((req, res, ex) -> { res.setStatus(401); res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Entre na sua conta.\"}"); })
            .accessDeniedHandler((req, res, ex) -> { res.setStatus(403); res.setContentType("application/json"); res.getWriter().write("{\"message\":\"Acesso negado ou sessão expirada. Atualize a página.\"}"); }));
        http.logout(l -> l.logoutUrl("/auth/logout").deleteCookies("TESOOB_STORE_SESSION")
            .logoutSuccessHandler((req, res, auth) -> res.setStatus(204)));
        http.addFilterBefore(new AuthRateLimit(), UsernamePasswordAuthenticationFilter.class);
        if (registrations.getIfAvailable() != null) {
            http.oauth2Login(o -> o.userInfoEndpoint(u -> u.oidcUserService(google))
                .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
                .successHandler((req, res, auth) -> {
                    var oidc = (OidcUser) auth.getPrincipal();
                    var user = users.findByGoogleId(oidc.getSubject()).filter(u -> u.enabled).orElseThrow();
                    var safe = UsernamePasswordAuthenticationToken.authenticated(user.email, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.role)));
                    var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(safe);
                    SecurityContextHolder.setContext(context); contexts.saveContext(context, req, res);
                    res.sendRedirect("/loja/conta?google=success");
                }).failureHandler((req, res, ex) -> res.sendRedirect("/loja/conta?error=google")));
        }
        return http.build();
    }
}
