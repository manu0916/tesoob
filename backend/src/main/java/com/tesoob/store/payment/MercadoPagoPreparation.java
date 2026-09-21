package com.tesoob.store.payment;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MercadoPagoPreparation implements PaymentGateway {
    @Override public PaymentPreparation prepare(UUID orderId, BigDecimal total, String currency) {
        return new PaymentPreparation("MERCADO_PAGO", "AWAITING_INTEGRATION", null,
            "Pedido registrado. O pagamento ainda não está disponível e nenhuma cobrança foi feita.");
    }
}
