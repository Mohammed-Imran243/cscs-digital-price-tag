package com.cscs.digitalpricetag.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class RateLimitingFilter implements Filter {

    private final boolean enabled;
    private final int maxTokens;
    private final AtomicInteger tokens;
    private final AtomicLong lastRefillTime = new AtomicLong(System.currentTimeMillis());
    private static final long REFILL_PERIOD_MS = 60000; // 1 minute

    public RateLimitingFilter(
            @Value("${rate-limiting.enabled:true}") boolean enabled,
            @Value("${rate-limiting.max-requests-per-minute:100}") int maxTokens) {
        this.enabled = enabled;
        this.maxTokens = maxTokens;
        this.tokens = new AtomicInteger(maxTokens);
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (!enabled) {
            chain.doFilter(request, response);
            return;
        }

        refillTokens();

        if (tokens.getAndDecrement() > 0) {
            chain.doFilter(request, response);
        } else {
            // Put the token back
            tokens.incrementAndGet();
            
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("{\"success\":false,\"message\":\"Too Many Requests - Dragon ESL API quota limit reached. Please try again later.\",\"status\":429}");
        }
    }

    private void refillTokens() {
        long now = System.currentTimeMillis();
        long lastRefill = lastRefillTime.get();
        long elapsedTime = now - lastRefill;

        if (elapsedTime >= REFILL_PERIOD_MS) {
            if (lastRefillTime.compareAndSet(lastRefill, now)) {
                tokens.set(maxTokens);
            }
        }
    }
}
