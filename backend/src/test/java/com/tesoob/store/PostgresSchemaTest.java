package com.tesoob.store;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import static org.junit.jupiter.api.Assertions.*;

/** Runs the real production DDL in an isolated native PostgreSQL process. */
class PostgresSchemaTest {
    @Test void migrationsApplyAndValidate() throws Exception {
        try(var postgres=EmbeddedPostgres.builder().setServerConfig("listen_addresses","127.0.0.1").setPort(0).start()) {
            var flyway=Flyway.configure().dataSource(postgres.getPostgresDatabase()).load();
            assertEquals(1,flyway.migrate().migrationsExecuted);flyway.validate();assertEquals(0,flyway.migrate().migrationsExecuted);
        }
    }
}
