package com.tesoob.store.payment;

import java.math.BigDecimal;
import java.util.UUID;

/** Future adapter must use server prices, provider idempotency, signed webhooks and reconciliation. */
public interface PaymentGateway {
    record PaymentPreparation(String provider, String status, String redirectUrl, String message) {}
    PaymentPreparation prepare(UUID orderId, BigDecimal total, String currency);
}
