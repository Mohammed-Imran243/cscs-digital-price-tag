package com.cscs.digitalpricetag.config;

import com.cscs.digitalpricetag.service.DragonTokenManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebClientConfig {

    private static final Logger log = LoggerFactory.getLogger(WebClientConfig.class);

    private final DragonEslProperties props;
    private final ObjectMapper objectMapper;

    public WebClientConfig(DragonEslProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
    }

    private HttpClient createHttpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, props.getConnectTimeoutMs())
                .responseTimeout(Duration.ofMillis(props.getReadTimeoutMs()))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(props.getReadTimeoutMs(), TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(props.getConnectTimeoutMs(), TimeUnit.MILLISECONDS))
                );
    }

    /**
     * WebClient specifically for Auth/Login.
     * Does NOT have Bearer token injection or retry filters to avoid circular dependencies.
     */
    @Bean(name = "dragonEslAuthWebClient")
    public WebClient dragonEslAuthWebClient() {
        return WebClient.builder()
                .baseUrl(props.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * Main WebClient for standard Dragon ESL API calls.
     * Injects Bearer token and automatically retries on auth failures.
     */
    @Bean(name = "dragonEslWebClient")
    public WebClient dragonEslWebClient(@Lazy DragonTokenManager tokenManager) {
        return WebClient.builder()
                .baseUrl(props.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .filter(bearerTokenFilter(tokenManager))
                .filter(retryAuthFilter(tokenManager))
                .build();
    }

    private ExchangeFilterFunction bearerTokenFilter(DragonTokenManager tokenManager) {
        return (request, next) -> {
            String token = null;
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
            // If the user is logged in as the system user (e.g. DG0358), we use the shared system token
            // instead of their user-specific token to prevent concurrent login conflicts.
            boolean isSystemUser = auth != null && auth.getName() != null && auth.getName().equalsIgnoreCase(props.getUsername());
            
            if (!isSystemUser && auth != null && auth.getCredentials() instanceof String) {
                token = (String) auth.getCredentials();
            }
            if (token == null || token.isBlank() || "null".equalsIgnoreCase(token)) {
                token = tokenManager.getValidToken();
            }
            ClientRequest authorizedRequest = ClientRequest.from(request)
                    .header(HttpHeaders.AUTHORIZATION, token)
                    .build();
            return next.exchange(authorizedRequest);
        };
    }

    private ExchangeFilterFunction retryAuthFilter(DragonTokenManager tokenManager) {
        return (request, next) -> next.exchange(request).flatMap(response -> {
            // Check for HTTP 401 — trigger refresh or propagate user-specific logout
            if (response.statusCode().equals(HttpStatus.UNAUTHORIZED)) {
                org.springframework.security.core.Authentication auth =
                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getCredentials() instanceof String && !auth.getName().equalsIgnoreCase(props.getUsername())) {
                    log.warn("User session expired on Dragon ESL for user {}. Propagating 401 Unauthorized.", auth.getName());
                    return Mono.just(response);
                }

                log.warn("Dragon ESL returned 401 Unauthorized. Triggering token manager background refresh and retrying.");
                tokenManager.forceRefresh();
                
                String newToken = tokenManager.getValidToken();
                ClientRequest retryRequest = ClientRequest.from(request)
                        .header(HttpHeaders.AUTHORIZATION, newToken)
                        .build();
                return next.exchange(retryRequest);
            }

            // Check for 200 OK with business errors 10006 or 10013 in the JSON body
            if (response.statusCode().is2xxSuccessful() && response.headers().contentType().stream().anyMatch(MediaType.APPLICATION_JSON::includes)) {
                return response.bodyToMono(String.class).flatMap(bodyStr -> {
                    try {
                        JsonNode jsonNode = objectMapper.readTree(bodyStr);
                        if (jsonNode.has("code")) {
                            int code = jsonNode.get("code").asInt();
                            if (code == 10006 || code == 10013) {
                                org.springframework.security.core.Authentication auth =
                                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                                if (auth != null && auth.getCredentials() instanceof String && !auth.getName().equalsIgnoreCase(props.getUsername())) {
                                    log.warn("User session conflict/expired on Dragon ESL for user {} (code {}). Propagating 401 to UI.", auth.getName(), code);
                                    // Return 401 response so UI triggers immediate logout
                                    return Mono.just(ClientResponse.create(HttpStatus.UNAUTHORIZED, response.strategies())
                                            .headers(headers -> headers.addAll(response.headers().asHttpHeaders()))
                                            .body("{\"success\":false,\"code\":10013,\"message\":\"Session conflict or expired on Dragon ESL\"}")
                                            .build());
                                }

                                log.warn("Dragon ESL returned system business error {} (Token expired/invalid). Triggering background token refresh and retrying.", code);
                                tokenManager.forceRefresh();
                                
                                String newToken = tokenManager.getValidToken();
                                ClientRequest retryRequest = ClientRequest.from(request)
                                        .header(HttpHeaders.AUTHORIZATION, newToken)
                                        .build();
                                return next.exchange(retryRequest);
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Failed to parse JSON response body for retry filter: {}", e.getMessage());
                    }
                    
                    // Re-wrap the body since we consumed it
                    return Mono.just(ClientResponse.create(response.statusCode(), response.strategies())
                            .headers(headers -> headers.addAll(response.headers().asHttpHeaders()))
                            .body(bodyStr)
                            .build());
                });
            }

            return Mono.just(response);
        });
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.debug("Dragon ESL --> {} {}", request.method(), request.url());
            return Mono.just(request);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.debug("Dragon ESL <-- HTTP {}", response.statusCode());
            return Mono.just(response);
        });
    }
}