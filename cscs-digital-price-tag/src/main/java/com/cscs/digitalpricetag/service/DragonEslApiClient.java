package com.cscs.digitalpricetag.service;

import com.cscs.digitalpricetag.exception.DragonEslException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.UUID;

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

    private String generateRequestId() {
        return "REQ-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private <T> reactor.util.retry.Retry buildRetrySpec(String requestId, String method, String uri) {
        return reactor.util.retry.Retry.backoff(2, Duration.ofSeconds(1))
                .filter(this::isTransientError)
                .doBeforeRetry(retrySignal -> log.warn("[{}] Retrying {} {} due to transient error: {} (Attempt: {})",
                        requestId, method, uri, retrySignal.failure().getMessage(), retrySignal.totalRetries() + 1));
    }

    public <T> T get(String uri, Class<T> responseType) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] GET {} — Sending request", requestId, uri);
            T response = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(responseType)
                    .retryWhen(buildRetrySpec(requestId, "GET", uri))
                    .block();
            log.info("[{}] GET {} — Response: {}", requestId, uri, response);
            return response;
        } catch (Exception e) {
            throw translateException("GET", uri, requestId, e);
        }
    }

    public <T> T get(String uriTemplate, Class<T> responseType, Object... uriVars) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] GET {} (args) — Sending request", requestId, uriTemplate);
            T response = webClient.get()
                    .uri(uriTemplate, uriVars)
                    .retrieve()
                    .bodyToMono(responseType)
                    .retryWhen(buildRetrySpec(requestId, "GET", uriTemplate))
                    .block();
            log.info("[{}] GET {} — Response: {}", requestId, uriTemplate, response);
            return response;
        } catch (Exception e) {
            throw translateException("GET", uriTemplate, requestId, e);
        }
    }

    public <T> T post(String uri, Object body, Class<T> responseType) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] POST {} — Outgoing Payload: {}", requestId, uri, body);
            T response = webClient.post()
                    .uri(uri)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(responseType)
                    .retryWhen(buildRetrySpec(requestId, "POST", uri))
                    .block();
            log.info("[{}] POST {} — Response: {}", requestId, uri, response);
            return response;
        } catch (Exception e) {
            throw translateException("POST", uri, requestId, e);
        }
    }

    public <T> T put(String uri, Object body, Class<T> responseType) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] PUT {} — Outgoing Payload: {}", requestId, uri, body);
            T response = webClient.put()
                    .uri(uri)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(responseType)
                    .retryWhen(buildRetrySpec(requestId, "PUT", uri))
                    .block();
            log.info("[{}] PUT {} — Response: {}", requestId, uri, response);
            return response;
        } catch (Exception e) {
            throw translateException("PUT", uri, requestId, e);
        }
    }

    public <T> T put(String uri, Class<T> responseType) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] PUT {} — Sending request", requestId, uri);
            T response = webClient.put()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(responseType)
                    .retryWhen(buildRetrySpec(requestId, "PUT", uri))
                    .block();
            log.info("[{}] PUT {} — Response: {}", requestId, uri, response);
            return response;
        } catch (Exception e) {
            throw translateException("PUT", uri, requestId, e);
        }
    }

    public <T> T delete(String uri, Class<T> responseType) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] DELETE {} — Sending request", requestId, uri);
            T response = webClient.delete()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(responseType)
                    .retryWhen(buildRetrySpec(requestId, "DELETE", uri))
                    .block();
            log.info("[{}] DELETE {} — Response: {}", requestId, uri, response);
            return response;
        } catch (Exception e) {
            throw translateException("DELETE", uri, requestId, e);
        }
    }

    public <T> T delete(String uri, Object body, Class<T> responseType) {
        String requestId = generateRequestId();
        try {
            log.info("[{}] DELETE {} — Outgoing Payload: {}", requestId, uri, body);
            T response;
            if (body == null) {
                response = webClient.delete()
                        .uri(uri)
                        .retrieve()
                        .bodyToMono(responseType)
                        .retryWhen(buildRetrySpec(requestId, "DELETE", uri))
                        .block();
            } else {
                response = webClient.method(org.springframework.http.HttpMethod.DELETE)
                        .uri(uri)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .body(org.springframework.web.reactive.function.BodyInserters.fromValue(body))
                        .retrieve()
                        .bodyToMono(responseType)
                        .retryWhen(buildRetrySpec(requestId, "DELETE", uri))
                        .block();
            }
            log.info("[{}] DELETE {} — Response: {}", requestId, uri, response);
            return response;
        } catch (Exception e) {
            throw translateException("DELETE", uri, requestId, e);
        }
    }

    private DragonEslException translateException(String method, String uri, String requestId, Throwable e) {
        Throwable actual = e;
        if (e.getClass().getName().contains("RetryExhaustedException")) {
            if (e.getCause() != null) {
                actual = e.getCause();
            }
        }

        if (actual instanceof WebClientResponseException webEx) {
            log.error("[{}] Dragon ESL {} {} failed — HTTP {}: {}", requestId, method, uri, webEx.getStatusCode(), webEx.getResponseBodyAsString());
            return new DragonEslException("Dragon ESL " + method + " " + uri + " failed: " + webEx.getResponseBodyAsString(), HttpStatus.BAD_GATEWAY);
        }

        log.error("[{}] Dragon ESL {} {} failed — {}", requestId, method, uri, actual.getMessage(), actual);
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        if (isTimeoutException(actual)) {
            log.error("[{}] TIMEOUT DETECTED: Dragon ESL {} {} failed due to read/connect timeout. Details: {}", requestId, method, uri, actual.getMessage());
            status = HttpStatus.GATEWAY_TIMEOUT;
        }
        return new DragonEslException("Dragon ESL " + method + " " + uri + " failed: " + actual.getMessage(), status);
    }

    private boolean isTimeoutException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof java.net.SocketTimeoutException 
                    || current instanceof io.netty.handler.timeout.ReadTimeoutException
                    || current instanceof io.netty.handler.timeout.WriteTimeoutException
                    || current instanceof io.netty.channel.ConnectTimeoutException
                    || current instanceof java.util.concurrent.TimeoutException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean isTransientError(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (isTimeoutException(current) 
                    || current instanceof reactor.netty.http.client.PrematureCloseException) {
                return true;
            }
            if (current instanceof java.io.IOException && current.getMessage() != null 
                    && current.getMessage().toLowerCase().contains("connection reset")) {
                return true;
            }
            if (current instanceof WebClientResponseException webEx) {
                int status = webEx.getStatusCode().value();
                if (status == 401 || status == 502 || status == 503) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
