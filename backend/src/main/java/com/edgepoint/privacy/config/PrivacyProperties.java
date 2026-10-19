package com.edgepoint.privacy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.privacy")
public class PrivacyProperties {
    /** Days a college has to respond to a data-principal request. Unverified against the DPDP Rules. */
    private int responseDays = 30;
    /** When true the nightly retention job only counts; set false to let it anonymise. */
    private boolean retentionDryRun = true;
}
