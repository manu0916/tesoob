package com.tesoob.store.web;

import com.tesoob.store.domain.*;
import com.tesoob.store.security.CurrentUser;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final AuthenticationManager authentication;
    private final SecurityContextRepository contexts;
    private final CurrentUser current;
    private final ObjectProvider<ClientRegistrationRepository> registrations;
    public AuthController(UserRepository users, PasswordEncoder passwords, AuthenticationManager authentication,
        SecurityContextRepository contexts, CurrentUser current, ObjectProvider<ClientRegistrationRepository> registrations) {
        this.users = users; this.passwords = passwords; this.authentication = authentication;
        this.contexts = contexts; this.current = current; this.registrations = registrations;
    }
    public record Credentials(@NotBlank @Email @Size(max=254) String email, @NotBlank @Size(min=12,max=72) String password) {}
    public record UserView(UUID id, String email, String role) {
        static UserView of(StoreUser u) { return new UserView(u.id, u.email, u.role); }
    }
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) { return Map.of("token", token.getToken(), "headerName", token.getHeaderName()); }
    @GetMapping("/options") public Map<String,Boolean> options() { return Map.of("google", registrations.getIfAvailable() != null); }
    @GetMapping("/me") public UserView me() { return UserView.of(current.require()); }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Map<String,String> register(@Valid @RequestBody Credentials input) {
        String email = normalize(input.email());
        if (input.password().getBytes(StandardCharsets.UTF_8).length > 72) throw new ApiException(HttpStatus.BAD_REQUEST, "A senha excede 72 bytes.");
        if (users.findByEmail(email).isPresent()) throw new ApiException(HttpStatus.CONFLICT, "Não foi possível criar a conta com este e-mail.");
        var user = new StoreUser(); user.email = email; user.passwordHash = passwords.encode(input.password());
        users.saveAndFlush(user);
        return Map.of("message", "Conta criada. Entre com seu e-mail e senha.");
    }
    @PostMapping("/login")
    public UserView login(@Valid @RequestBody Credentials input, HttpServletRequest req, HttpServletResponse res) {
        var auth = authentication.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(normalize(input.email()), input.password()));
        // Rotate any anonymous session to prevent fixation, then explicitly persist authentication.
        req.getSession(true); req.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(auth);
        SecurityContextHolder.setContext(context); contexts.saveContext(context, req, res);
        new HttpSessionCsrfTokenRepository().saveToken(null, req, res);
        return UserView.of(current.require());
    }
    private String normalize(String value) { return value.trim().toLowerCase(Locale.ROOT); }
}
