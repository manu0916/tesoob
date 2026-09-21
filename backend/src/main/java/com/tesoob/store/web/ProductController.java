package com.tesoob.store.web;

import com.tesoob.store.service.ProductService;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductController {
    private final ProductService products;
    public ProductController(ProductService products) { this.products = products; }
    public record ProductPage(List<ProductView> items, int page, int totalPages, long totalElements) {
        static ProductPage of(Page<ProductView> page) { return new ProductPage(page.getContent(), page.getNumber(), page.getTotalPages(), page.getTotalElements()); }
    }
    @GetMapping("/products") public ProductPage list(@RequestParam(defaultValue="0") int page) { return ProductPage.of(products.list(page)); }
    @GetMapping("/products/{id}") public ProductView get(@PathVariable UUID id) { return products.get(id); }
    @GetMapping("/admin/products") public ProductPage adminList(@RequestParam(defaultValue="0") int page) { return ProductPage.of(products.adminList(page)); }
    @PostMapping("/admin/products") @ResponseStatus(HttpStatus.CREATED)
    public ProductView create(@Valid @RequestBody ProductInput input) { return products.save(null, input); }
    @PutMapping("/admin/products/{id}") public ProductView update(@PathVariable UUID id, @Valid @RequestBody ProductInput input) { return products.save(id, input); }
    @DeleteMapping("/admin/products/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @RequestParam long version) { products.delete(id, version); }
}
