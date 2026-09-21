package com.tesoob.store.security;

import com.tesoob.store.domain.*;
import java.util.List;
import java.util.Locale;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.oidc.user.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleUserService extends OidcUserService {
    private final UserRepository users;
    public GoogleUserService(UserRepository users) { this.users = users; }
    @Override @Transactional
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        OidcUser identity = super.loadUser(request); // Spring validates signature, issuer, audience and nonce.
        if (!Boolean.TRUE.equals(identity.getEmailVerified()) || identity.getEmail() == null) throw denied();
        String email = identity.getEmail().trim().toLowerCase(Locale.ROOT);
        StoreUser user = users.findByGoogleId(identity.getSubject()).orElse(null);
        if (user == null) {
            // Never auto-link an existing local/admin account based only on a matching email.
            if (users.findByEmail(email).isPresent()) throw denied();
            user = new StoreUser(); user.email = email; user.googleId = identity.getSubject();
            users.saveAndFlush(user);
        }
        if (!user.enabled) throw denied();
        // Google's stable subject identifies this temporary OIDC principal; the success handler replaces it.
        return new DefaultOidcUser(List.of(new SimpleGrantedAuthority("ROLE_" + user.role)), identity.getIdToken(), identity.getUserInfo(), "sub");
    }
    private OAuth2AuthenticationException denied() { return new OAuth2AuthenticationException(new OAuth2Error("identity_conflict")); }
}
