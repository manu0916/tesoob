package com.tesoob.store.web;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

public record ProductInput(
    @NotBlank @Size(max=140) String name,
    @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal price,
    @NotBlank @Size(max=2048) String imageUrl,
    @NotBlank @Size(max=10000) String description,
    @Size(max=3000) String observation,
    @NotNull Boolean active,
    @NotNull @PositiveOrZero Long version
) {}
