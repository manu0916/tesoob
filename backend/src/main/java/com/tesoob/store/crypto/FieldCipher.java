package com.tesoob.store.crypto;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.stream.Collectors;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;

@Service
@EnableConfigurationProperties(CryptoProperties.class)
public class FieldCipher {
    private final SecureRandom random = new SecureRandom();
    private final String active;
    private final Map<String, SecretKey> keys;
    public FieldCipher(CryptoProperties config) {
        active = config.activeKey();
        if (config.keys() == null || config.keys().isEmpty()) throw new IllegalStateException("Encryption keys required");
        keys = config.keys().entrySet().stream().collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, entry -> {
            if (!entry.getKey().matches("[A-Za-z0-9_-]{1,32}")) throw new IllegalStateException("Invalid key ID");
            byte[] bytes = Base64.getDecoder().decode(entry.getValue());
            if (bytes.length != 32) throw new IllegalStateException("Encryption requires a 256-bit key");
            return new SecretKeySpec(bytes, "AES");
        }));
        if (!keys.containsKey(active)) throw new IllegalStateException("Active encryption key missing");
    }
    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        byte[] nonce = new byte[12];
        random.nextBytes(nonce);
        byte[] ciphertext = crypt(Cipher.ENCRYPT_MODE, active, nonce, plaintext.getBytes(StandardCharsets.UTF_8));
        return active + "." + Base64.getEncoder().encodeToString(nonce) + "." + Base64.getEncoder().encodeToString(ciphertext);
    }
    public String decrypt(String envelope) {
        if (envelope == null) return null;
        try {
            String[] parts = envelope.split("\\.", -1);
            if (parts.length != 3 || !keys.containsKey(parts[0])) throw new IllegalArgumentException();
            byte[] nonce = Base64.getDecoder().decode(parts[1]);
            if (nonce.length != 12) throw new IllegalArgumentException();
            return new String(crypt(Cipher.DECRYPT_MODE, parts[0], nonce, Base64.getDecoder().decode(parts[2])), StandardCharsets.UTF_8);
        } catch (RuntimeException ex) {
            // Never expose the payload or a decryption oracle through an API response.
            throw new IllegalStateException("Encrypted data could not be authenticated");
        }
    }
    private byte[] crypt(int mode, String keyId, byte[] nonce, byte[] input) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(mode, keys.get(keyId), new GCMParameterSpec(128, nonce));
            cipher.updateAAD(("tesoob/orders/checkout/v1/" + keyId).getBytes(StandardCharsets.UTF_8));
            return cipher.doFinal(input);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Encryption operation failed");
        }
    }
}
