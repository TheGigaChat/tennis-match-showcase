package com.tennismatch.backend.domain.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class PhotoDto
{
    private Long id;
    private String url;
}
