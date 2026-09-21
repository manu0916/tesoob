package com.tesoob.store;

import com.fasterxml.jackson.databind.*;
import com.tesoob.store.domain.*;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.http.MediaType;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"server.servlet.session.cookie.secure=false", "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=OFF"})
@AutoConfigureMockMvc
class StoreIntegrationTest {
    static final EmbeddedPostgres postgres = startDatabase();
    static EmbeddedPostgres startDatabase() {
        try { var pg=EmbeddedPostgres.builder().setServerConfig("listen_addresses","127.0.0.1").setPort(0).start();
            Runtime.getRuntime().addShutdownHook(new Thread(()->{try{pg.close();}catch(Exception ignored){}}));return pg;
        }catch(Exception ex){throw new IllegalStateException("Cannot start isolated PostgreSQL",ex);}
    }
    @Autowired MockMvc mvc; @Autowired ObjectMapper json; @Autowired UserRepository users;
    @Autowired ProductRepository products; @Autowired OrderRepository orders; @Autowired JdbcTemplate jdbc; @Autowired PasswordEncoder passwords;
    @DynamicPropertySource static void encryption(DynamicPropertyRegistry registry){byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);registry.add("store.crypto.keys.v1",()->Base64.getEncoder().encodeToString(bytes));registry.add("spring.datasource.url",()->postgres.getJdbcUrl("postgres","postgres"));registry.add("spring.datasource.username",()->"postgres");registry.add("spring.datasource.password",()->"postgres");}
    @BeforeEach void setup(){orders.deleteAll();products.deleteAll();users.deleteAll();}
    StoreUser account(String email,String role){var u=new StoreUser();u.email=email;u.role=role;u.passwordHash=passwords.encode("A-long-test-password");return users.saveAndFlush(u);}
    Product product(){var p=new Product();p.name="Peça de teste";p.price=new BigDecimal("129.90");p.description="Descrição";p.imageUrl="/media/editorial-06.webp";return products.saveAndFlush(p);}
    @Test void accessAndCsrfProtectProductWrites() throws Exception {
        var admin=account("admin@example.test","ADMIN");var customer=account("buyer@example.test","CUSTOMER");
        String input="{\"name\":\"Peça\",\"price\":123.45,\"imageUrl\":\"/media/editorial-06.webp\",\"description\":\"Detalhes\",\"observation\":\"   \",\"active\":true,\"version\":0}";
        mvc.perform(post("/admin/products").contentType(MediaType.APPLICATION_JSON).content(input).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/admin/products").with(user(customer.email).roles("CUSTOMER")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isForbidden());
        mvc.perform(post("/admin/products").with(user(admin.email).roles("ADMIN")).contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isForbidden());
        var created=mvc.perform(post("/admin/products").with(user(admin.email).roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isCreated()).andExpect(jsonPath("$.observation").isEmpty()).andReturn();
        String id=json.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(get("/products/"+id)).andExpect(status().isOk());
        mvc.perform(put("/admin/products/"+id).with(user(admin.email).roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(input.replace("123.45","150.00"))).andExpect(status().isOk()).andExpect(jsonPath("$.price").value(150));
        mvc.perform(put("/admin/products/"+id).with(user(admin.email).roles("ADMIN")).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isConflict());
        mvc.perform(delete("/admin/products/"+id+"?version=1").with(user(admin.email).roles("ADMIN")).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/products/"+id)).andExpect(status().isNotFound());
    }
    @Test void localSignupCannotChooseRoleAndLoginPersistsInHttpOnlySession() throws Exception {
        String credentials="{\"email\":\"new@example.test\",\"password\":\"A-long-test-password\"}";
        mvc.perform(post("/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(credentials.replace("}",",\"role\":\"ADMIN\"}"))).andExpect(status().isBadRequest());
        mvc.perform(post("/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(credentials)).andExpect(status().isCreated());
        var u=users.findByEmail("new@example.test").orElseThrow();assertEquals("CUSTOMER",u.role);assertTrue(u.passwordHash.startsWith("$2"));assertNotEquals("A-long-test-password",u.passwordHash);
        // Exercise actual browser token exchange, not only the csrf() test helper.
        var tokenResponse=mvc.perform(get("/auth/csrf")).andExpect(status().isOk()).andReturn();
        var token=json.readTree(tokenResponse.getResponse().getContentAsString());
        var session=(MockHttpSession)tokenResponse.getRequest().getSession(false);
        var login=mvc.perform(post("/auth/login").session(session).header(token.get("headerName").asText(),token.get("token").asText()).contentType(MediaType.APPLICATION_JSON).content(credentials)).andExpect(status().isOk()).andReturn();
        session=(MockHttpSession)login.getRequest().getSession(false);
        mvc.perform(get("/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("CUSTOMER"));
        mvc.perform(post("/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void checkoutEncryptsPersonalDataUsesServerPriceAndIsIdempotentAndOwnerScoped() throws Exception {
        var buyer=account("one@example.test","CUSTOMER");var other=account("two@example.test","CUSTOMER");var p=product();
        var billing=Map.of("recipient","Pessoa Teste","document","52998224725","postalCode","01310100","street","Rua Privada","number","42","complement","Apto 9","district","Centro","city","São Paulo","state","SP");
        var payload=new HashMap<String,Object>();payload.put("productId",p.id);payload.put("productVersion",p.version);payload.put("quantity",2);payload.put("billing",billing);
        String body=json.writeValueAsString(payload);String key=UUID.randomUUID().toString();
        mvc.perform(post("/checkout").with(csrf()).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isUnauthorized());
        var response=mvc.perform(post("/checkout").with(user(buyer.email)).with(csrf()).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk()).andExpect(jsonPath("$.order.total").value(259.80)).andExpect(jsonPath("$.payment.status").value("AWAITING_INTEGRATION")).andReturn();
        String id=json.readTree(response.getResponse().getContentAsString()).at("/order/id").asText();
        assertFalse(response.getResponse().getContentAsString().contains("52998224725"));
        String stored=jdbc.queryForObject("select checkout_ciphertext from orders where id = ?",String.class,UUID.fromString(id));
        assertNotNull(stored);assertTrue(stored.startsWith("v1."));assertFalse(stored.contains("Rua Privada"));assertFalse(stored.contains("52998224725"));
        assertTrue(orders.findById(UUID.fromString(id)).orElseThrow().checkoutJson.contains("Rua Privada"));
        mvc.perform(post("/checkout").with(user(buyer.email)).with(csrf()).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk()).andExpect(jsonPath("$.order.id").value(id));assertEquals(1,orders.count());
        payload.put("quantity",3);mvc.perform(post("/checkout").with(user(buyer.email)).with(csrf()).header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload))).andExpect(status().isConflict());
        payload.put("total",0.01);mvc.perform(post("/checkout").with(user(buyer.email)).with(csrf()).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload))).andExpect(status().isBadRequest());
        mvc.perform(get("/orders/"+id).with(user(other.email))).andExpect(status().isNotFound());
        mvc.perform(get("/orders/"+id).with(user(buyer.email))).andExpect(status().isOk());
    }
    @Test void stalePriceAndInvalidCpfDoNotCreateOrders() throws Exception {
        var buyer=account("test@example.test","CUSTOMER");var p=product();
        String body="{\"productId\":\""+p.id+"\",\"productVersion\":8,\"quantity\":1,\"billing\":{\"recipient\":\"Teste\",\"document\":\"52998224725\",\"postalCode\":\"01310100\",\"street\":\"Rua Teste\",\"number\":\"1\",\"district\":\"Centro\",\"city\":\"São Paulo\",\"state\":\"SP\"}}";
        mvc.perform(post("/checkout").with(user(buyer.email)).with(csrf()).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
        mvc.perform(post("/checkout").with(user(buyer.email)).with(csrf()).header("Idempotency-Key",UUID.randomUUID().toString()).contentType(MediaType.APPLICATION_JSON).content(body.replace("52998224725","11111111111"))).andExpect(status().isBadRequest());
        assertEquals(0,orders.count());
    }
}
