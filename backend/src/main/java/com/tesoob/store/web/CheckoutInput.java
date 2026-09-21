package com.tesoob.store.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;

public record CheckoutInput(@NotNull UUID productId, @Min(1) @Max(10) int quantity,
    @NotNull @PositiveOrZero Long productVersion, @NotNull @Valid Billing billing) {
    public record Billing(
        @NotBlank @Size(max=140) String recipient,
        @NotBlank @Pattern(regexp="[0-9]{11}") String document,
        @NotBlank @Pattern(regexp="[0-9]{8}") String postalCode,
        @NotBlank @Size(max=160) String street,
        @NotBlank @Size(max=20) String number,
        @Size(max=100) String complement,
        @NotBlank @Size(max=100) String district,
        @NotBlank @Size(max=100) String city,
        @NotBlank @Pattern(regexp="AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO") String state
    ) {}
}
