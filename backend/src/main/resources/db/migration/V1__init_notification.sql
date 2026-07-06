CREATE TABLE IF NOT EXISTS notification_configs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE,
    
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(255),
    smtp_from_email VARCHAR(255),
    smtp_from_name VARCHAR(255),
    smtp_use_ssl BOOLEAN DEFAULT true,
    smtp_enabled BOOLEAN DEFAULT false,
    
    whatsapp_api_url VARCHAR(255),
    whatsapp_api_key VARCHAR(255),
    whatsapp_phone_number_id VARCHAR(255),
    whatsapp_business_account_id VARCHAR(255),
    whatsapp_enabled BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);
