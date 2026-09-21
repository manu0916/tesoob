package com.tesoob.store.security;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Run locally via java -cp (see STOREFRONT.md); never accepts passwords as CLI arguments. */
public class SecretTools {
    public static void main(String[] args) {
        if (args.length == 1 && args[0].equals("aes")) {
            byte[] key = new byte[32];new SecureRandom().nextBytes(key);System.out.println(Base64.getEncoder().encodeToString(key));return;
        }
        var console=System.console(); if(console==null)throw new IllegalStateException("Use an interactive terminal");
        char[] password=console.readPassword("Administrator password (12+ chars): ");
        if(password==null)throw new IllegalStateException("Password required");
        try{String value=new String(password);if(value.length()<12 || value.getBytes(StandardCharsets.UTF_8).length>72)throw new IllegalArgumentException("Use 12+ chars, max 72 UTF-8 bytes");System.out.println(new BCryptPasswordEncoder(12).encode(value));}
        finally{Arrays.fill(password,'\0');}
    }
}
