"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GlobeInstance } from "globe.gl";
import type { Incident, Severity } from "@/lib/types";

interface RotatingGlobeProps {
  incidents: Incident[];
  selectedIncident?: Incident;
}

interface GlobePoint {
  id: string;
  provider: string;
  title: string;
  lat: number;
  lng: number;
  severity: Severity;
  category: string;
  color: string;
  size: number;
}

interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string[];
}

const severityColor: Record<Severity, string> = {
  critical: "#ff5e7a",
  major: "#ffbf4b",
  minor: "#4bd1ff",
  info: "#3ef4c2",
};

const operationsHub = { lat: 39.04, lng: -77.49 };

export function RotatingGlobe({ incidents, selectedIncident }: RotatingGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);

  const points = useMemo<GlobePoint[]>(
    () =>
      incidents.map((incident) => ({
        id: incident.id,
        provider: incident.provider,
        title: incident.title,
        lat: incident.lat,
        lng: incident.lng,
        severity: incident.severity,
        category: incident.category,
        color: severityColor[incident.severity],
        size: incident.severity === "critical" ? 0.42 : incident.severity === "major" ? 0.34 : 0.26,
      })),
    [incidents],
  );

  const arcs = useMemo<GlobeArc[]>(
    () =>
      points.map((point) => ({
        startLat: operationsHub.lat,
        startLng: operationsHub.lng,
        endLat: point.lat,
        endLng: point.lng,
        color: ["rgba(75, 209, 255, 0.08)", point.color],
      })),
    [points],
  );

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;

    async function mountGlobe() {
      const el = containerRef.current;
      if (!el || globeRef.current) return;

      const [{ default: Globe }, THREE] = await Promise.all([import("globe.gl"), import("three")]);
      if (cancelled || !containerRef.current) return;

      const globe = new Globe(el, {
        rendererConfig: { alpha: true, antialias: true },
      });

      globeRef.current = globe;

      globe
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
        .showAtmosphere(true)
        .atmosphereColor("#2dd9ff")
        .atmosphereAltitude(0.18)
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude(0.025)
        .pointRadius("size")
        .pointColor("color")
        .pointLabel((point) => {
          const outage = point as GlobePoint;
          return `${outage.provider} | ${outage.category}<br/>${outage.title}`;
        })
        .pointsMerge(false)
        .ringsData(points)
        .ringLat("lat")
        .ringLng("lng")
        .ringColor((point) => {
          const outage = point as GlobePoint;
          return (t: number) => `${outage.color}${Math.round((1 - t) * 180).toString(16).padStart(2, "0")}`;
        })
        .ringMaxRadius(4.8)
        .ringPropagationSpeed(1.6)
        .ringRepeatPeriod(1800)
        .arcsData(arcs)
        .arcStartLat("startLat")
        .arcStartLng("startLng")
        .arcEndLat("endLat")
        .arcEndLng("endLng")
        .arcColor("color")
        .arcAltitude(0.18)
        .arcStroke(0.35)
        .arcDashLength(0.42)
        .arcDashGap(1.8)
        .arcDashAnimateTime(4200)
        .pointsData(points);

      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.45;
      globe.controls().enableZoom = false;
      globe.controls().enablePan = false;
      globe.pointOfView({ lat: 24, lng: -55, altitude: 1.72 }, 0);

      new THREE.TextureLoader().load("https://unpkg.com/three-globe/example/clouds/clouds.png", (texture) => {
        if (cancelled || !globeRef.current) return;

        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(globe.getGlobeRadius() * 1.006, 80, 80),
          new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
          }),
        );

        globe.scene().add(clouds);

        function spinClouds() {
          if (cancelled) return;
          clouds.rotation.y += 0.00035;
          requestAnimationFrame(spinClouds);
        }

        spinClouds();
      });

      function sizeGlobe() {
        const bounds = el.getBoundingClientRect();
        globe.width(Math.max(bounds.width, 320)).height(Math.max(bounds.height, 320));
      }

      sizeGlobe();
      resizeObserver = new ResizeObserver(sizeGlobe);
      resizeObserver.observe(el);
    }

    mountGlobe();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      globeRef.current?._destructor();
      globeRef.current = null;
    };
  }, [arcs, points]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedIncident) return;

    globe
      .pointsData(points)
      .ringsData(points)
      .arcsData(arcs)
      .pointOfView({ lat: selectedIncident.lat, lng: selectedIncident.lng, altitude: 1.48 }, 900);
  }, [arcs, points, selectedIncident]);

  return (
    <div className="rotating-globe" aria-hidden>
      <div ref={containerRef} className="rotating-globe-canvas" />
      <div className="rotating-globe-vignette" />
      <div className="rotating-globe-scan" />
    </div>
  );
}
