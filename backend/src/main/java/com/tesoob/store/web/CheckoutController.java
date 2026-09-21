package com.tesoob.store.web;

import com.tesoob.store.service.CheckoutService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class CheckoutController {
    private final CheckoutService checkout;
    public CheckoutController(CheckoutService checkout) { this.checkout=checkout; }
    @PostMapping("/checkout") public CheckoutService.CheckoutResult create(@RequestHeader("Idempotency-Key") UUID key, @Valid @RequestBody CheckoutInput input) { return checkout.create(key,input); }
    @GetMapping("/orders/{id}") public OrderView get(@PathVariable UUID id) { return checkout.get(id); }
    @GetMapping("/orders") public Map<String,Object> list(@RequestParam(defaultValue="0") int page) {
        var result=checkout.list(page); return Map.of("items",result.getContent(),"page",result.getNumber(),"totalPages",result.getTotalPages());
    }
}
