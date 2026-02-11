package com.tennismatch.backend.domain.dto.location;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/** PATCH input (all fields nullable, like PreferenceDto) */
@Getter @Setter
public class LocationPatchDto {
    private Double latitude;    // -90..90
    private Double longitude;   // -180..180
    private Double accuracy_m;  // >= 0
    @JsonProperty("place_name")
    private String placeName;
}
