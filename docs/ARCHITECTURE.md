# Architecture

Atmosphera is a static site: no framework, no dependencies, no build step. ES modules
under `src/js/` are served as-is. The interesting structure is in how the scene is
rendered.

## Data flow

```
Open-Meteo forecast payload
        │
        ├── weatherState (state.js) ──── "current conditions" record
        │
        └── SceneMoment (scene/moment.js) ── one renderable instant
                    │
                    ▼
        renderer (app.js frame loop → scene/*)
```

One fetch per location returns current conditions plus a 7-day hourly series
(temperature, weather code, day flag, cloud cover, wind, precipitation) and daily
sunrise/sunset times.

## The SceneMoment

The renderer never reads application state or the wall clock. Every frame, the loop
resolves a single **SceneMoment** — a plain value describing one instant:

```
{ code, isDay, cloudCover, windSpeed, precipitation, temp,
  minuteOfDay, sunriseMin, sunsetMin, sunProgress, moonPhase }
```

and passes it to every draw function. Two constructors produce it:

- `momentFromConditions(conditions, atMs)` — the live path: current conditions
  sampled at wall-clock time. This is what renders by default.
- `momentAt(data, unixSec)` — samples the full hourly forecast at an arbitrary time,
  interpolating continuous quantities (temperature, cloud cover, wind) between hours
  and stepping categorical ones (weather code, day flag). Sunrise/sunset come from
  the correct forecast day, so the sun's arc is right on any day in the window.

`setMomentOverride(m)` swaps the rendered moment without touching live state. Scrub
a slider through the next 24 hours, feed each position through `momentAt`, and the
whole scene — sun position, sky color, precipitation — follows the forecast. Clear
the override and the scene snaps back to now. The renderer cannot tell the
difference, which is the point.

`moonPhase` (0 = new, 0.5 = full, from the synodic month) rides along on every
moment for the same reason: when the moon render learns phases, the data is already
where the renderer looks.

## Deterministic layout

Scene composition is seeded by location (`scene/rng.js`). Each subsystem — stars,
clouds, terrain grass, fog banks, birds — draws its layout from a generator seeded
by a hash of the coordinates plus a per-subsystem label. Consequences:

- The same city always composes the same scene. Reykjavik looks like the same
  Reykjavik on every visit, every device.
- Re-running an init is idempotent. Resizes (including the mobile keyboard
  appearing) and background data refreshes rebuild layout from the same seed
  instead of reshuffling the sky mid-glance.
- Subsystem streams are independent: adding a draw call to one never perturbs
  another.

Transient randomness — particle respawn positions, lightning bolt paths, cloud
re-entry after drifting off-screen — deliberately stays on `Math.random()`. Events
should differ between viewings; composition should not.

## Everything else

`ui.js` owns the DOM (panel, search, unit toggle, random-city die, swipe gesture),
`api.js` owns the two Open-Meteo endpoints, `weather-engine.js` maps WMO weather
codes to scene effects (rain/snow intensity, fog, lightning) when a location's
weather arrives. Location selects carry a sequence token so a slow response that
has been superseded discards itself instead of mislabeling a city.
