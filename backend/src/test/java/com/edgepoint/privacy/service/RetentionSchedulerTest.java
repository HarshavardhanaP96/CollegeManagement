package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.College;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.privacy.config.PrivacyProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RetentionSchedulerTest {

    @Mock CollegeRepository colleges;
    @Mock RetentionService service;

    College college(int id, boolean deleted) {
        College c = new College();
        c.setCollegeId(id);
        c.setIsDeleted(deleted);
        return c;
    }

    @Test
    void runsOncePerLiveCollegeInDryRunByDefault() {
        when(colleges.findAll()).thenReturn(List.of(college(1, false), college(2, true), college(3, false)));

        new RetentionScheduler(colleges, service, new PrivacyProperties()).runNightly();

        verify(service).run(eq(1), eq(true), isNull());
        verify(service).run(eq(3), eq(true), isNull());
        verify(service, never()).run(eq(2), anyBoolean(), any());
    }

    @Test
    void goesLiveOnlyWhenDryRunIsSwitchedOff() {
        PrivacyProperties live = new PrivacyProperties();
        live.setRetentionDryRun(false);
        when(colleges.findAll()).thenReturn(List.of(college(1, false)));

        new RetentionScheduler(colleges, service, live).runNightly();

        verify(service).run(eq(1), eq(false), isNull());
    }

    @Test
    void oneCollegeFailingDoesNotStopTheOthers() {
        when(colleges.findAll()).thenReturn(List.of(college(1, false), college(3, false)));
        when(service.run(eq(1), anyBoolean(), any())).thenThrow(new IllegalStateException("boom"));

        new RetentionScheduler(colleges, service, new PrivacyProperties()).runNightly();

        verify(service).run(eq(3), eq(true), isNull());
    }
}
