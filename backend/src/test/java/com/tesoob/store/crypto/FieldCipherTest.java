package com.tesoob.store.crypto;

import java.security.SecureRandom;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FieldCipherTest {
    private String key() { byte[] value=new byte[32];new SecureRandom().nextBytes(value);return Base64.getEncoder().encodeToString(value); }
    @Test void roundTripUsesUniqueNoncesAndRejectsTampering() {
        var cipher=new FieldCipher(new CryptoProperties("v1",Map.of("v1",key())));
        String plain="{\"document\":\"52998224725\",\"street\":\"Rua Teste\"}";
        String one=cipher.encrypt(plain),two=cipher.encrypt(plain);
        assertNotEquals(one,two);assertFalse(one.contains("Rua Teste"));assertEquals(plain,cipher.decrypt(one));
        String[] parts=one.split("\\.");byte[] bytes=Base64.getDecoder().decode(parts[2]);bytes[0]^=1;
        String changed=parts[0]+"."+parts[1]+"."+Base64.getEncoder().encodeToString(bytes);
        assertThrows(IllegalStateException.class,()->cipher.decrypt(changed));
        assertThrows(IllegalStateException.class,()->cipher.decrypt("plaintext"));
        assertNull(cipher.encrypt(null));assertNull(cipher.decrypt(null));
    }
    @Test void rotationReadsOldEnvelopesButWritesWithTheNewKey() {
        String oldKey=key(),newKey=key();var old=new FieldCipher(new CryptoProperties("v1",Map.of("v1",oldKey)));
        var rotated=new FieldCipher(new CryptoProperties("v2",Map.of("v1",oldKey,"v2",newKey)));
        assertEquals("sensitive",rotated.decrypt(old.encrypt("sensitive")));
        assertTrue(rotated.encrypt("next").startsWith("v2."));
        assertThrows(IllegalStateException.class,()->new FieldCipher(new CryptoProperties("v1",Map.of("v1",Base64.getEncoder().encodeToString(new byte[16])))));
    }
}
