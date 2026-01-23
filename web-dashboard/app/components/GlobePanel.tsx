"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  Viewer,
  Entity,
  BillboardGraphics,
  LabelGraphics,
  PointGraphics,
} from "resium";
import {
  Ion,
  Cartesian3,
  Color,
  VerticalOrigin,
  HorizontalOrigin,
  LabelStyle,
  NearFarScalar,
  defined,
} from "cesium";
import { incidentToLonLat, getSeverityColor } from "@/src/lib/incidentToLonLat";

// Set Cesium base URL for assets
if (typeof window !== "undefined") {
  (window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL =
    process.env.NEXT_PUBLIC_CESIUM_BASE_URL || "/cesium";
}

// Disable Ion (we're using default imagery)
Ion.defaultAccessToken = "";

export interface GlobeIncident {
  id: string;
  provider: string;
  title: string;
  severity: string;
  regions?: string[];
  geo_lon?: number | null;
  geo_lat?: number | null;
}

interface GlobePanelProps {
  incidents: GlobeIncident[];
  activeIncidentId?: string | null;
}

export default function GlobePanel({ incidents, activeIncidentId }: GlobePanelProps) {
  const viewerRef = useRef<{ cesiumElement?: { scene?: { globe?: { enableLighting?: boolean }; camera?: { rotateRight?: (amount: number) => void } } } } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Idle rotation effect
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      if (viewerRef.current?.cesiumElement?.scene?.camera) {
        // Slow rotation: ~0.5 degrees per second
        const rotationSpeed = 0.0001 * deltaTime;
        viewerRef.current.cesiumElement.scene.camera.rotateRight?.(rotationSpeed);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Memoize incident positions
  const incidentPositions = useMemo(() => {
    return incidents.map((incident) => {
      const { lon, lat } = incidentToLonLat(incident);
      const color = getSeverityColor(incident.severity);
      const isActive = incident.id === activeIncidentId;

      return {
        ...incident,
        position: Cartesian3.fromDegrees(lon, lat),
        color: Color.fromBytes(color.r, color.g, color.b, color.a),
        isActive,
      };
    });
  }, [incidents, activeIncidentId]);

  return (
    <div className="w-full h-full relative">
      {/* Load Cesium CSS */}
      <link rel="stylesheet" href="/cesium/Widgets/widgets.css" />

      <Viewer
        ref={viewerRef as React.RefObject<never>}
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        selectionIndicator={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        vrButton={false}
        creditContainer={undefined}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {incidentPositions.map((incident) => (
          <Entity key={incident.id} position={incident.position}>
            {/* Main point marker */}
            <PointGraphics
              pixelSize={incident.isActive ? 16 : 12}
              color={incident.color}
              outlineColor={Color.WHITE}
              outlineWidth={2}
              scaleByDistance={new NearFarScalar(1.5e6, 1.5, 1.5e8, 0.5)}
            />

            {/* Pulse ring for active incident */}
            {incident.isActive && (
              <BillboardGraphics
                image="/cesium/Assets/Textures/pin.svg"
                scale={0.8}
                color={incident.color.withAlpha(0.5)}
                verticalOrigin={VerticalOrigin.CENTER}
                horizontalOrigin={HorizontalOrigin.CENTER}
              />
            )}

            {/* Provider label */}
            <LabelGraphics
              text={incident.provider.toUpperCase()}
              font="bold 12px sans-serif"
              fillColor={Color.WHITE}
              outlineColor={Color.BLACK}
              outlineWidth={2}
              style={LabelStyle.FILL_AND_OUTLINE}
              verticalOrigin={VerticalOrigin.BOTTOM}
              horizontalOrigin={HorizontalOrigin.CENTER}
              pixelOffset={new Cartesian3(0, -20, 0) as unknown as undefined}
              scaleByDistance={new NearFarScalar(1.5e6, 1.0, 1.5e8, 0.3)}
              showBackground={true}
              backgroundColor={Color.fromCssColorString("rgba(0,0,0,0.7)")}
            />

            {/* Title label (smaller, below provider) */}
            <LabelGraphics
              text={incident.title.length > 30 ? incident.title.substring(0, 30) + "..." : incident.title}
              font="10px sans-serif"
              fillColor={incident.color}
              outlineColor={Color.BLACK}
              outlineWidth={1}
              style={LabelStyle.FILL_AND_OUTLINE}
              verticalOrigin={VerticalOrigin.TOP}
              horizontalOrigin={HorizontalOrigin.CENTER}
              pixelOffset={new Cartesian3(0, 20, 0) as unknown as undefined}
              scaleByDistance={new NearFarScalar(1.5e6, 1.0, 1.5e8, 0.0)}
            />
          </Entity>
        ))}
      </Viewer>

      {/* Overlay chip for "3D GLOBE" label */}
      <div className="absolute top-5 left-5 z-[400] flex items-center gap-3 pointer-events-none">
        <div className="map-chip">
          <div className="w-2 h-2 rounded-full bg-[color:var(--cyan)] animate-pulse" />
          <span className="text-xs font-bold tracking-widest text-white/90">3D GLOBE</span>
        </div>
        <div className="map-chip bg-black/40">
          <span className="text-[11px] tracking-[0.22em] text-white/60 uppercase font-bold">
            {incidents.length} Active
          </span>
        </div>
      </div>
    </div>
  );
}
