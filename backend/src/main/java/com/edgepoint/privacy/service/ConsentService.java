package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.NoticeView;
import com.edgepoint.privacy.dto.PurposeView;
import com.edgepoint.privacy.repository.ConsentRecordRepository;
import com.edgepoint.privacy.repository.PrivacyNoticeRepository;
import com.edgepoint.privacy.repository.PrivacyPurposeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConsentService {

    private final PrivacyPurposeRepository purposes;
    private final PrivacyNoticeRepository notices;
    private final ConsentRecordRepository consents;
    private final PrivacyAuditService audit;
    private final PrivacyTenant tenant;

    private record Row(PrivacyPurpose purpose, ConsentRecord latest) {
    }

    @Transactional
    public NoticeView currentNotice() {
        Integer college = tenant.collegeId();
        Optional<PrivacyNotice> notice = notices.findFirstByCollegeIdOrderByVersionDesc(college);
        List<Row> rows = rows(college, tenant.userId());
        Integer noticeId = notice.map(PrivacyNotice::getNoticeId).orElse(null);
        boolean requiresAction = noticeId != null && rows.stream().anyMatch(r ->
                r.purpose().getLegalBasis() == LegalBasis.CONSENT
                        && (r.latest() == null || !noticeId.equals(r.latest().getNoticeId())));
        return new NoticeView(noticeId,
                notice.map(PrivacyNotice::getVersion).orElse(null),
                notice.map(PrivacyNotice::getBody).orElse(null),
                notice.map(PrivacyNotice::getEffectiveFrom).orElse(null),
                requiresAction,
                rows.stream().map(this::view).toList());
    }

    @Transactional
    public List<PurposeView> myConsents() {
        return rows(tenant.collegeId(), tenant.userId()).stream().map(this::view).toList();
    }

    @Transactional
    public PurposeView recordConsent(Integer purposeId, ConsentStatus status, String sourceIp) {
        tenant.requireActiveUser();
        Integer college = tenant.collegeId();
        Integer user = tenant.userId();
        PrivacyPurpose purpose = purposes.findByPurposeIdAndCollegeId(purposeId, college)
                .filter(PrivacyPurpose::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("PrivacyPurpose", "id", purposeId));
        PrivacyNotice notice = notices.findFirstByCollegeIdOrderByVersionDesc(college)
                .orElseThrow(() -> new BusinessRuleViolationException("No privacy notice has been published yet"));
        if (status == ConsentStatus.WITHDRAWN && !purpose.isWithdrawable()) {
            throw new BusinessRuleViolationException("Consent for this purpose cannot be withdrawn: " + purpose.getName());
        }
        Optional<ConsentRecord> latest = consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(user, purposeId);
        if (latest.isPresent() && latest.get().getStatus() == status
                && notice.getNoticeId().equals(latest.get().getNoticeId())) {
            return view(new Row(purpose, latest.get()));
        }
        ConsentRecord row = new ConsentRecord();
        row.setCollegeId(college);
        row.setUserId(user);
        row.setPurposeId(purposeId);
        row.setNoticeId(notice.getNoticeId());
        row.setStatus(status);
        row.setSourceIp(sourceIp);
        ConsentRecord saved = consents.save(row);
        audit.record(college, user, user, "CONSENT_" + status, "purpose=" + purpose.getCode());
        return view(new Row(purpose, saved));
    }

    @Transactional
    public PrivacyNotice publishNotice(String body) {
        if (body == null || body.isBlank()) {
            throw new BusinessRuleViolationException("Notice text is required");
        }
        Integer college = tenant.collegeId();
        int next = notices.findFirstByCollegeIdOrderByVersionDesc(college)
                .map(n -> n.getVersion() + 1).orElse(1);
        PrivacyNotice notice = new PrivacyNotice();
        notice.setCollegeId(college);
        notice.setVersion(next);
        notice.setBody(body.trim());
        notice.setPublishedBy(tenant.userId());
        PrivacyNotice saved = notices.save(notice);
        audit.record(college, tenant.userId(), null, "NOTICE_PUBLISHED", "version=" + next);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<PrivacyNotice> listNotices(Integer collegeParam) {
        return notices.findByCollegeIdOrderByVersionDesc(tenant.collegeId(collegeParam));
    }

    private List<Row> rows(Integer college, Integer user) {
        ensureDefaultPurposes(college);
        return purposes.findByCollegeIdAndActiveTrueOrderByPurposeId(college).stream()
                .map(p -> new Row(p, consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(user, p.getPurposeId()).orElse(null)))
                .toList();
    }

    private PurposeView view(Row r) {
        PrivacyPurpose p = r.purpose();
        ConsentRecord c = r.latest();
        return new PurposeView(p.getPurposeId(), p.getCode(), p.getName(), p.getDescription(), p.getLegalBasis(),
                p.isWithdrawable(), c == null ? null : c.getStatus(), c == null ? null : c.getRecordedAt());
    }

    private void ensureDefaultPurposes(Integer college) {
        if (purposes.countByCollegeId(college) > 0) {
            return;
        }
        seed(college, "ACADEMIC_RECORDS", "Academic records",
                "Enrolment, attendance, marks and results needed to run your course.", LegalBasis.LEGITIMATE_USE, false);
        seed(college, "EMAIL_SMS_COMMS", "Email and SMS communications",
                "Notices, reminders and announcements sent to you by email or SMS.", LegalBasis.CONSENT, true);
        seed(college, "PARENT_NOTIFICATIONS", "Notifications to parent or guardian",
                "Attendance and marks alerts sent to the parent or guardian contact on your profile.", LegalBasis.CONSENT, true);
    }

    private void seed(Integer college, String code, String name, String description, LegalBasis basis, boolean withdrawable) {
        PrivacyPurpose p = new PrivacyPurpose();
        p.setCollegeId(college);
        p.setCode(code);
        p.setName(name);
        p.setDescription(description);
        p.setLegalBasis(basis);
        p.setWithdrawable(withdrawable);
        p.setActive(true);
        purposes.save(p);
    }
}
