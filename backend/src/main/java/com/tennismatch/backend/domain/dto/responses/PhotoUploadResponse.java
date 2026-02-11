package com.tennismatch.backend.domain.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PhotoUploadResponse {
    private Long id;
    private String url;
}
