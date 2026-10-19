package com.edgepoint.privacy.contributor;

import java.util.Map;
import java.util.Set;

/**
 * A module's hook into the privacy workflows. Implement it as a Spring bean and the module's data
 * is automatically included in access exports, corrections and erasure.
 */
public interface PersonalDataContributor {

    /** Key of this module's block in the export bundle. */
    String section();

    /** The user's data held by this module; an empty map when there is none. Never include secrets. */
    Map<String, Object> export(Integer userId);

    /** The only field names {@link #correct} accepts. */
    Set<String> correctableFields();

    /** Apply a correction; callers pass only keys from {@link #correctableFields()}. */
    void correct(Integer userId, Map<String, String> fields);

    /** Remove direct identifiers while keeping the record. Must be safe to call twice. */
    void anonymise(Integer userId);
}
