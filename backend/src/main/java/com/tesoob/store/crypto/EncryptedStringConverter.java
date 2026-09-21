package com.tesoob.store.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/** Hibernate obtains this converter from Spring's BeanContainer. Never use static keys. */
@Converter
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    private final FieldCipher cipher;
    public EncryptedStringConverter(FieldCipher cipher) { this.cipher = cipher; }
    @Override public String convertToDatabaseColumn(String value) { return cipher.encrypt(value); }
    @Override public String convertToEntityAttribute(String value) { return cipher.decrypt(value); }
}
