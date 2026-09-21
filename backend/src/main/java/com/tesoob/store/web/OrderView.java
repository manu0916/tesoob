package com.tesoob.store.web;

import com.tesoob.store.domain.StoreOrder;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Deliberately excludes recipient, address, document and payment credentials. */
public record OrderView(UUID id, String productName, int quantity, BigDecimal total, String currency, String status, Instant createdAt) {
    public static OrderView of(StoreOrder order) { return new OrderView(order.id, order.productName, order.quantity, order.total, order.currency, order.status, order.createdAt); }
}
