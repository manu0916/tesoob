package com.tesoob.store.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tesoob.store.domain.*;
import com.tesoob.store.payment.PaymentGateway;
import com.tesoob.store.security.CurrentUser;
import com.tesoob.store.web.*;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class CheckoutService {
    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final CurrentUser current;
    private final ObjectMapper json;
    private final PaymentGateway payments;
    public CheckoutService(UserRepository users, ProductRepository products, OrderRepository orders, CurrentUser current, ObjectMapper json, PaymentGateway payments) {
        this.users=users; this.products=products; this.orders=orders; this.current=current; this.json=json; this.payments=payments;
    }
    public record CheckoutResult(OrderView order, PaymentGateway.PaymentPreparation payment) {}
    public record PrivateCheckout(UUID orderId, UUID userId, CheckoutInput request) {}
    public CheckoutResult create(UUID key, CheckoutInput input) {
        var user = users.lockById(current.require().id).orElseThrow(); // serializes retries, including multiple instances
        if (!validCpf(input.billing().document())) throw new ApiException(HttpStatus.BAD_REQUEST, "Confira o CPF informado.");
        var previous = orders.findByUserIdAndIdempotencyKey(user.id, key);
        if (previous.isPresent()) {
            var order = previous.get();
            try {
                var stored = json.readValue(order.checkoutJson, PrivateCheckout.class);
                if (!order.id.equals(stored.orderId()) || !user.id.equals(stored.userId())) throw new IllegalStateException();
                if (!stored.request().equals(input)) throw new ApiException(HttpStatus.CONFLICT, "Esta tentativa já foi usada com outros dados. Reabra o checkout.");
            } catch (ApiException ex) { throw ex; }
            catch (Exception ex) { throw new IllegalStateException("Invalid encrypted checkout"); }
            return result(order);
        }
        var product = products.lockActive(input.productId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto indisponível."));
        if (product.version != input.productVersion()) throw new ApiException(HttpStatus.CONFLICT, "O produto ou preço mudou. Atualize e revise o checkout.");
        var order = new StoreOrder(); order.userId=user.id; order.productId=product.id; order.productName=product.name;
        order.quantity=input.quantity(); order.unitPrice=product.price; order.total=product.price.multiply(BigDecimal.valueOf(input.quantity()));
        order.idempotencyKey=key;
        try { order.checkoutJson=json.writeValueAsString(new PrivateCheckout(order.id, user.id, input)); }
        catch (Exception ex) { throw new IllegalStateException("Unable to encode checkout"); }
        orders.saveAndFlush(order); // converter encrypts BEFORE binding values to the JDBC statement
        return result(order);
    }
    @Transactional(readOnly=true) public OrderView get(UUID id) {
        return OrderView.of(orders.findByIdAndUserId(id, current.require().id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,"Pedido não encontrado.")));
    }
    @Transactional(readOnly=true) public Page<OrderView> list(int page) {
        return orders.findByUserId(current.require().id, PageRequest.of(Math.max(0,page),12,Sort.by(Sort.Direction.DESC,"createdAt"))).map(OrderView::of);
    }
    private CheckoutResult result(StoreOrder order) { return new CheckoutResult(OrderView.of(order), payments.prepare(order.id, order.total, order.currency)); }
    static boolean validCpf(String value) {
        if (value == null || !value.matches("[0-9]{11}") || value.chars().distinct().count() == 1) return false;
        for (int n=9;n<=10;n++) {
            int sum=0; for (int i=0;i<n;i++) sum+=(value.charAt(i)-'0')*(n+1-i);
            int digit=(sum*10)%11; if (digit==10) digit=0;
            if (digit!=value.charAt(n)-'0') return false;
        }
        return true;
    }
}
