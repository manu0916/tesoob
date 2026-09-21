package com.tesoob.store;

import com.tesoob.store.domain.*;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.boot.SpringApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Explicit, disposable demo: test classpath only, absent from the production jar. */
public class PreviewServer {
    public static void main(String[] args) throws Exception {
        var postgres=EmbeddedPostgres.builder().setServerConfig("listen_addresses","127.0.0.1").setPort(0).start();
        byte[] key=new byte[32];new SecureRandom().nextBytes(key);
        var app=SpringApplication.run(StoreApplication.class,
            "--server.address=127.0.0.1", "--server.port=8080", "--server.servlet.session.cookie.secure=false",
            "--spring.datasource.url="+postgres.getJdbcUrl("postgres","postgres"),
            "--spring.datasource.username=postgres", "--spring.datasource.password=postgres",
            "--store.crypto.keys.v1="+Base64.getEncoder().encodeToString(key),
            "--store.bootstrap.email=", "--store.bootstrap.password-hash=", "--debug=false", "--logging.level.root=WARN");
        Runtime.getRuntime().addShutdownHook(new Thread(()->{app.close();try{postgres.close();}catch(Exception ignored){}}));
        var products=app.getBean(ProductRepository.class);
        String[][] samples={
            {"[DEMO] Vermelho. Sem rodeios.","320.00","editorial-06.webp","Amarrações, ilhoses e uma presença que ocupa a cena. Produto e preço demonstrativos.",""},
            {"[DEMO] Verde. Fora do padrão.","380.00","editorial-05.webp","Ferragens e recortes em verde militar. Produto e preço demonstrativos.","Referência demonstrativa. Consulte as medidas antes de encomendar."},
            {"[DEMO] Camadas de expressão.","450.00","processo-04.webp","Jeans claro, tons roxos e aplicações em camadas. Produto e preço demonstrativos.",""}
        };
        for(var row:samples){var p=new Product();p.name=row[0];p.price=new BigDecimal(row[1]);p.imageUrl="/media/"+row[2];p.description=row[3];p.observation=row[4].isBlank()?null:row[4];products.save(p);}
        String password=System.getenv("STORE_PREVIEW_PASSWORD");
        if(password!=null && password.length()>=12){var user=new StoreUser();user.email="admin@preview.test";user.role="ADMIN";user.passwordHash=app.getBean(PasswordEncoder.class).encode(password);app.getBean(UserRepository.class).save(user);}
        System.out.println("Preview ready on 127.0.0.1:8080; disposable PostgreSQL, DEMO products only.");
    }
}
