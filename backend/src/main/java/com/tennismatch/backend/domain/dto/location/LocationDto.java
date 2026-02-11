package com.tennismatch.backend.domain.dto.location;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/** Frontend response (matches TS LocationRow) */
@Getter @Setter
public class LocationDto {
    private double latitude;
    private double longitude;
    private Double accuracy_m;  // may be null
    private String updated_at;  // ISO-8601
    @JsonProperty("place_name")
    private String placeName;
}
