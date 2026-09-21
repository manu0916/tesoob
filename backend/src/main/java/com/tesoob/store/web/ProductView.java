package com.tesoob.store.web;

import com.tesoob.store.domain.Product;
import java.math.BigDecimal;
import java.util.UUID;

public record ProductView(UUID id, String name, BigDecimal price, String imageUrl, String description,
    String observation, boolean active, long version) {
    public static ProductView of(Product p) { return new ProductView(p.id, p.name, p.price, p.imageUrl, p.description, p.observation, p.active, p.version); }
}
