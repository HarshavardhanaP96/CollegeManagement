package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationChannelRule;
import com.edgepoint.notification.domain.NotificationConfig;
import com.edgepoint.notification.domain.NotificationEventType;
import com.edgepoint.notification.repository.NotificationChannelRuleRepository;
import com.edgepoint.notification.repository.NotificationConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationDispatcherTest {

    private static final int COLLEGE = 7;
    private static final NotificationEventType EVENT = NotificationEventType.ATTENDANCE_ABSENCE;

    @Mock NotificationConfigRepository configRepository;
    @Mock NotificationChannelRuleRepository ruleRepository;
    @Mock SmtpEmailSender emailSender;
    @Mock WhatsAppCloudSender whatsAppSender;

    NotificationDispatcher dispatcher;
    NotificationConfig config;

    @BeforeEach
    void setUp() {
        dispatcher = new NotificationDispatcher(configRepository, ruleRepository, emailSender, whatsAppSender);
        config = new NotificationConfig();
        config.setCollegeId(COLLEGE);
        config.setSmtpEnabled(true);
        config.setWhatsappEnabled(true);
        when(configRepository.findByCollegeId(COLLEGE)).thenReturn(Optional.of(config));
        when(ruleRepository.findByCollegeId(COLLEGE)).thenReturn(List.of());
    }

    @Test
    void noStoredRule_usesDefaults_emailOnWhatsappOff() {
        dispatcher.onNotification(message("p@x.com", "+911234567890"));

        verify(emailSender).send(eq(config), any());
        verifyNoInteractions(whatsAppSender);
    }

    @Test
    void ruleEnablesBothChannels_sendsBoth() {
        when(ruleRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(rule(EVENT, true, true)));

        dispatcher.onNotification(message("p@x.com", "+911234567890"));

        verify(emailSender).send(eq(config), any());
        verify(whatsAppSender).send(eq(config), any());
    }

    @Test
    void ruleDisablesEmail_emailNotSent() {
        when(ruleRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(rule(EVENT, false, true)));

        dispatcher.onNotification(message("p@x.com", "+911234567890"));

        verifyNoInteractions(emailSender);
        verify(whatsAppSender).send(eq(config), any());
    }

    @Test
    void ruleForOtherEventIsIgnored() {
        when(ruleRepository.findByCollegeId(COLLEGE))
                .thenReturn(List.of(rule(NotificationEventType.FEE_REMINDER, false, true)));

        dispatcher.onNotification(message("p@x.com", "+911234567890"));

        verify(emailSender).send(eq(config), any());
        verifyNoInteractions(whatsAppSender);
    }

    @Test
    void channelDisabledInConfig_isNotUsedEvenIfRuleAllows() {
        config.setSmtpEnabled(false);
        when(ruleRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(rule(EVENT, true, false)));

        dispatcher.onNotification(message("p@x.com", "+911234567890"));

        verifyNoInteractions(emailSender, whatsAppSender);
    }

    @Test
    void noConfigRow_sendsNothing() {
        when(configRepository.findByCollegeId(COLLEGE)).thenReturn(Optional.empty());

        dispatcher.onNotification(message("p@x.com", "+911234567890"));

        verifyNoInteractions(emailSender, whatsAppSender);
    }

    @Test
    void missingRecipientAddress_skipsThatChannel() {
        when(ruleRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(rule(EVENT, true, true)));

        dispatcher.onNotification(message(null, "+911234567890"));
        dispatcher.onNotification(message("p@x.com", " "));

        verify(emailSender, times(1)).send(eq(config), any());
        verify(whatsAppSender, times(1)).send(eq(config), any());
    }

    @Test
    void emailFailure_doesNotStopWhatsappOrPropagate() {
        when(ruleRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(rule(EVENT, true, true)));
        doThrow(new RuntimeException("smtp down")).when(emailSender).send(any(), any());

        assertThatCode(() -> dispatcher.onNotification(message("p@x.com", "+911234567890")))
                .doesNotThrowAnyException();
        verify(whatsAppSender).send(eq(config), any());
    }

    private static NotificationMessage message(String email, String phone) {
        return new NotificationMessage(COLLEGE, EVENT, email, phone, "Subject", "Body");
    }

    private static NotificationChannelRule rule(NotificationEventType t, boolean email, boolean wa) {
        NotificationChannelRule r = new NotificationChannelRule();
        r.setCollegeId(COLLEGE);
        r.setEventType(t);
        r.setEmailEnabled(email);
        r.setWhatsappEnabled(wa);
        return r;
    }
}
