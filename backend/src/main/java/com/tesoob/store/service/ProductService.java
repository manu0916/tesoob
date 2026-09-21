package com.tesoob.store.service;

import com.tesoob.store.domain.*;
import com.tesoob.store.security.CurrentUser;
import com.tesoob.store.web.*;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class ProductService {
    private final ProductRepository products;
    private final CurrentUser current;
    public ProductService(ProductRepository products, CurrentUser current) { this.products = products; this.current = current; }
    public Page<ProductView> list(int page) { return products.findByActiveTrue(page(page)).map(ProductView::of); }
    public ProductView get(UUID id) { return ProductView.of(products.findByIdAndActiveTrue(id).orElseThrow(this::missing)); }
    @PreAuthorize("hasRole('ADMIN')") public Page<ProductView> adminList(int page) {
        current.requireAdmin(); return products.findAll(page(page)).map(ProductView::of);
    }
    @PreAuthorize("hasRole('ADMIN')") @Transactional
    public ProductView save(UUID id, ProductInput input) {
        current.requireAdmin();
        Product product = id == null ? new Product() : products.findById(id).orElseThrow(this::missing);
        if (product.version != input.version()) throw new ApiException(HttpStatus.CONFLICT, "O produto foi alterado. Recarregue antes de salvar.");
        String image = input.imageUrl().trim();
        boolean local = image.matches("/media/[A-Za-z0-9._-]+\\.(webp|png|jpe?g)");
        try {
            URI uri = URI.create(image);
            if (!local && !("https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null)) throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) { throw new ApiException(HttpStatus.BAD_REQUEST, "Use uma URL HTTPS de imagem ou um arquivo em /media/."); }
        product.name = input.name().trim(); product.price = input.price(); product.imageUrl = image;
        product.description = input.description().trim(); product.active = input.active();
        product.observation = input.observation() == null || input.observation().isBlank() ? null : input.observation().trim();
        return ProductView.of(products.saveAndFlush(product));
    }
    @PreAuthorize("hasRole('ADMIN')") @Transactional
    public void delete(UUID id, long version) {
        current.requireAdmin(); var product = products.findById(id).orElseThrow(this::missing);
        if (version != product.version) throw new ApiException(HttpStatus.CONFLICT, "O produto foi alterado. Atualize a lista.");
        // Soft deletion preserves historical orders and excludes it from public queries.
        product.active = false; products.saveAndFlush(product);
    }
    private Pageable page(int value) { return PageRequest.of(Math.max(0, value), 12, Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id"))); }
    private ApiException missing() { return new ApiException(HttpStatus.NOT_FOUND, "Produto não encontrado."); }
}
