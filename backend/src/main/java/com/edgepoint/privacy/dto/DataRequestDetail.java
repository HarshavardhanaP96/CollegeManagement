package com.edgepoint.privacy.dto;

import java.util.List;

public record DataRequestDetail(DataRequestView request, String correctionPayload, List<RequestEventView> events) {
}
