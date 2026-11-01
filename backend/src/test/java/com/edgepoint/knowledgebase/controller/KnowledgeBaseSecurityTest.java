package com.edgepoint.knowledgebase.controller;

import com.edgepoint.knowledgebase.domain.ArticleStatus;
import com.edgepoint.knowledgebase.dto.KbArticleDto;
import com.edgepoint.knowledgebase.service.KnowledgeBaseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Knowledge base endpoints: who may call what")
class KnowledgeBaseSecurityTest {

    private static final String ARTICLE_JSON = """
            {"categoryId":1,"title":"Marking attendance","slug":"marking-attendance",
             "body":"Open Attendance and tick each student.","status":"DRAFT"}""";

    @Autowired private MockMvc mockMvc;
    @MockBean private KnowledgeBaseService service;

    @ParameterizedTest
    @ValueSource(strings = {"COLLEGEADMIN", "HOD", "TEACHER", "STUDENT"})
    @DisplayName("non-superadmin roles get 403 on every admin write")
    void adminWritesForbidden(String role) throws Exception {
        mockMvc.perform(post("/knowledgebase/admin/articles").with(user("u").roles(role))
                .contentType(MediaType.APPLICATION_JSON).content(ARTICLE_JSON)).andExpect(status().isForbidden());
        mockMvc.perform(put("/knowledgebase/admin/articles/1").with(user("u").roles(role))
                .contentType(MediaType.APPLICATION_JSON).content(ARTICLE_JSON)).andExpect(status().isForbidden());
        mockMvc.perform(delete("/knowledgebase/admin/articles/1").with(user("u").roles(role)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/knowledgebase/admin/categories").with(user("u").roles(role))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"X\",\"slug\":\"x\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/knowledgebase/admin/articles").with(user("u").roles(role)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @Test
    @WithMockUser(roles = "SUPERADMIN")
    @DisplayName("superadmin can create an article")
    void superadminCreates() throws Exception {
        when(service.createArticle(any())).thenReturn(KbArticleDto.builder().id(9L).slug("marking-attendance")
                .status(ArticleStatus.DRAFT).build());

        mockMvc.perform(post("/knowledgebase/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON).content(ARTICLE_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(9));
    }

    @Test
    @WithMockUser(roles = "SUPERADMIN")
    @DisplayName("invalid article input is rejected before the service")
    void validation() throws Exception {
        mockMvc.perform(post("/knowledgebase/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":1,\"title\":\"T\",\"slug\":\"Not A Slug\",\"body\":\"b\"}"))
                .andExpect(status().isBadRequest());
        verify(service, never()).createArticle(any());
    }

    @Test
    @DisplayName("readers search with their own role and get a page")
    void readerSearchUsesCallerRole() throws Exception {
        Page<KbArticleDto> page = new PageImpl<>(List.of(KbArticleDto.builder().slug("a").build()));
        when(service.searchPublished(eq("TEACHER"), eq("exams"), eq("hall"), any())).thenReturn(page);

        mockMvc.perform(get("/knowledgebase/articles").param("category", "exams").param("q", "hall")
                        .with(user("t").roles("TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].slug").value("a"));
    }

    @Test
    @DisplayName("feedback needs a helpful flag")
    void feedbackValidation() throws Exception {
        mockMvc.perform(post("/knowledgebase/articles/3/feedback").with(user("s").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/knowledgebase/articles/3/feedback").with(user("s").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"helpful\":true}"))
                .andExpect(status().isOk());
        verify(service).vote("STUDENT", 3L, true);
    }

    @Test
    @DisplayName("anonymous callers cannot read the knowledge base")
    void anonymousRejected() throws Exception {
        mockMvc.perform(get("/knowledgebase/categories"))
                .andExpect(result -> org.assertj.core.api.Assertions.assertThat(result.getResponse().getStatus())
                        .isIn(401, 403));
        verify(service, never()).searchPublished(any(), isNull(), isNull(), any());
    }
}
