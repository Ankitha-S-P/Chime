package com.ankitha.chime.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Profile("prod")
public class DataSourceConfig {

    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() throws Exception {
        // Neon gives: postgresql://user:password@host/database?sslmode=require
        // JDBC driver can't parse embedded credentials reliably, so we extract them manually

        String normalizedUrl = databaseUrl;
        if (normalizedUrl.startsWith("jdbc:postgresql://")) {
            normalizedUrl = normalizedUrl.substring("jdbc:".length());
        }
        // Now normalizedUrl starts with postgresql://

        URI uri = new URI(normalizedUrl.replace("postgresql://", "http://"));

        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String database = uri.getPath().substring(1); // strip leading /
        String query = uri.getQuery() != null ? uri.getQuery() : "sslmode=require";

        String username = null;
        String password = null;
        if (uri.getUserInfo() != null) {
            String[] parts = uri.getUserInfo().split(":", 2);
            username = parts[0];
            password = parts.length > 1 ? parts[1] : "";
        }

        String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?%s", host, port, database, query);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}
