package com.tennismatch.backend.services;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.util.List;
import java.util.Optional;
import java.nio.charset.StandardCharsets;

@Service
public class MapboxGeocodingService {
    private final RestTemplate restTemplate;

    @Value("${app.mapbox.token:}")
    private String token;

    public MapboxGeocodingService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public Optional<GeoResult> geocode(String query) {
        if (query == null || query.isBlank()) return Optional.empty();
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Mapbox token not configured");
        }

        String encodedQuery = UriUtils.encodePathSegment(query, StandardCharsets.UTF_8);
        String url = UriComponentsBuilder
                .fromHttpUrl("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodedQuery + ".json")
                .queryParam("access_token", token)
                .queryParam("limit", 1)
                .queryParam("types", "address,place,locality,neighborhood,poi")
                .queryParam("language", "en")
                .build(true)
                .toUriString();

        MapboxResponse response = restTemplate.getForObject(url, MapboxResponse.class);
        if (response == null || response.features == null || response.features.isEmpty()) {
            return Optional.empty();
        }
        Feature top = response.features.get(0);
        if (top.center == null || top.center.size() < 2) return Optional.empty();
        double lon = top.center.get(0);
        double lat = top.center.get(1);
        return Optional.of(new GeoResult(lat, lon, top.placeName));
    }

    public record GeoResult(double latitude, double longitude, String placeName) {}

    private record MapboxResponse(List<Feature> features) {}

    private record Feature(List<Double> center, @JsonProperty("place_name") String placeName) {}
}
