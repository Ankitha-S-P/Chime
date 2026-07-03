package com.ankitha.chime.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

@Configuration
@Profile("prod")
public class DataSourceConfig {

    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() {
        // Neon gives postgresql:// but JDBC driver requires jdbc:postgresql://
        // This handles both formats automatically
        String jdbcUrl = databaseUrl;
        if (jdbcUrl.startsWith("postgresql://")) {
            jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring("postgresql://".length());
        } else if (!jdbcUrl.startsWith("jdbc:")) {
            jdbcUrl = "jdbc:postgresql://" + jdbcUrl;
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(jdbcUrl);
        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }
}
