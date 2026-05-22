package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Low-level Dragon ESL API client.
 *
 * Wraps the {@link WebClient} and automatically translates WebClient errors into {@link DragonEslException}.
 * Bearer token injection and auth retries are handled transparently by WebClient filters.
 */
@Component
public class DragonEslApiClient {

    private static final Logger log = LoggerFactory.getLogger(DragonEslApiClient.class);

    private final WebClient webClient;

    public DragonEslApiClient(@Qualifier("dragonEslWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    public <T> T get(String uri, Class<T> responseType) {
        try {
            return webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("GET", uri, e);
        }
    }

    public <T> T get(String uriTemplate, Class<T> responseType, Object... uriVars) {
        try {
            return webClient.get()
                    .uri(uriTemplate, uriVars)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("GET", uriTemplate, e);
        }
    }

    public <T> T post(String uri, Object body, Class<T> responseType) {
        try {
            return webClient.post()
                    .uri(uri)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("POST", uri, e);
        }
    }

    public <T> T put(String uri, Object body, Class<T> responseType) {
        try {
            return webClient.put()
                    .uri(uri)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("PUT", uri, e);
        }
    }

    public <T> T put(String uri, Class<T> responseType) {
        try {
            return webClient.put()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("PUT", uri, e);
        }
    }

    public <T> T delete(String uri, Class<T> responseType) {
        try {
            return webClient.delete()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("DELETE", uri, e);
        }
    }

    public <T> T delete(String uri, Object body, Class<T> responseType) {
        try {
            return webClient.method(org.springframework.http.HttpMethod.DELETE)
                    .uri(uri)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (WebClientResponseException e) {
            throw translateException("DELETE", uri, e);
        }
    }

    private DragonEslException translateException(String method, String uri, WebClientResponseException e) {
        log.error("Dragon ESL {} {} failed — HTTP {}: {}", method, uri, e.getStatusCode(), e.getResponseBodyAsString());
        // IMPORTANT: Never map Dragon ESL's 401 to our own 401.
        // Dragon ESL 401 means *their* token expired, not that our JWT is bad.
        // Always map upstream errors to BAD_GATEWAY to avoid confusing our Spring Security layer.
        return new DragonEslException("Dragon ESL " + method + " " + uri + " failed: " + e.getResponseBodyAsString(), HttpStatus.BAD_GATEWAY);
    }
}
