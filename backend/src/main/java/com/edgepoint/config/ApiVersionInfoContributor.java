package com.edgepoint.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.stereotype.Component;

/**
 * Adds the routing/API version (the "/api/{version}" prefix this build serves) to
 * /actuator/info, alongside the build.version Spring Boot already reports from
 * META-INF/build-info.properties. See docs/API_VERSIONING.md for the versioning convention.
 */
@Component
public class ApiVersionInfoContributor implements InfoContributor {

    @Value("${app.api-version:v1}")
    private String apiVersion;

    @Override
    public void contribute(Info.Builder builder) {
        builder.withDetail("apiVersion", apiVersion);
    }
}
