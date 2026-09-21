package com.tesoob.store.crypto;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("store.crypto")
public record CryptoProperties(String activeKey, Map<String, String> keys) {}
