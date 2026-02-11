package com.tennismatch.backend.utils;

import org.locationtech.jts.geom.*;
import org.springframework.stereotype.Component;

@Component
public class GeoFactory {
    private final GeometryFactory gf = new GeometryFactory(new PrecisionModel(), 4326);

    public Point pointFromLatLon(double lat, double lon) {
        Point p = gf.createPoint(new Coordinate(lon, lat)); // X=lon, Y=lat
        p.setSRID(4326);
        return p;
    }
}
