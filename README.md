# Container ship study guide

An interactive 3D study manual of a Tsuneishi 2,806 TEU geared container ship ("Chittagong Max") and its MAN B&W 7G60ME-C9.5 main engine. Built for mixed audiences: every part has three depths of explanation (Essentials, Engineer, Expert).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm start          # serves ./out
```

Requires Node 20.9 or newer. The build is a fully static site (`output: 'export'`), so `./out` can be hosted anywhere: Vercel, Netlify, GitHub Pages, S3, or plain nginx. On Vercel, import the repo and deploy with the default Next.js settings.

## What's in it

| Route | Sheet |
|---|---|
| `/` | Cover: clickable, dimensioned starboard elevation, drawing register, principal particulars, sources |
| `/ship/` | Whole ship in 3D. X-ray hull, tanks, deck cargo, sea; isolate any of 11 chapters; 8 camera views |
| `/engine/` | Animated 7G60ME-C9.5 in firing order; section cut; exploded cylinder unit; engine cycle panel |
| `/diagrams/[fo,cw,lo,air,bb,sa,el]/` | Seven animated flow diagrams in ISO 14726 colours |

Every part has a URL, e.g. `/engine/?part=me_crosshead` or `/ship/?part=crane`, so links can be shared or put in lesson notes. Press `Ctrl K` (or `/`) anywhere in the studio to search parts. Add `?quality=low` to force the fast graphics mode (no shadows, 1× resolution); it is chosen automatically on touch devices and machines with ≤ 4 CPU cores.

### Engine cycle panel

A single-zone thermodynamic model (`src/lib/physics/cycle.ts`) integrates the first law from exhaust-valve closing to opening with a Wiebe heat-release curve. It drives three linked charts:

- **P–V indicator diagram** (linear or log–log), with the motored curve and valve/port events
- **Pressure vs crank angle**, with SOI, EVO, PO, PC and EVC markers and Pmax/Pcomp labels
- **Layout and load diagram** after MAN's convention: layout area L1–L4, SMCR point M, lines 1, 3, 4, 5, 6, 7, 8 and the operating point on the propeller curve

A red dot on the P–V and pressure charts follows the chosen cylinder in the running 3D animation.

Inputs: engine load (25–110 % SMCR), start of injection, ECS Pmax control on/off, and the SMCR point (derating) clamped inside the layout area.

Calibration against published MAN figures, SMCR = L1:

| Load | Model SFOC | MAN SFOC (high-load tuning) | Pcomp | Pmax |
|---|---|---|---|---|
| 50 % | 165.3 g/kWh | 165.5 | 77 bar | 149 bar |
| 75 % | 164.4 g/kWh | 163.0 | 112 bar | 189 bar |
| 100 % | 171.4 g/kWh | 167.0 | 151 bar | 187 bar |

Power at L1 comes out at 2,678 kW/cyl against the published 2,680. The model is for understanding trends (why the ECS retards injection at high load, why MEP derating lowers SFOC), not for setting up an engine.

**Estimated inputs:** con-rod length 3.1 m, compression ratio 19, EVO 110°, ports 141–219°, EVC 265°, γ = 1.34, friction MEP, Pmax limit 190 bar, heat-release efficiency. Scavenge pressure follows the shape of a published 6G60ME-C9.5 shop-test report (3.86 bar g at SMCR), scaled by MEP. Heat transfer, detailed gas exchange and the turbocharger are not modelled. The position of load-diagram line 4 is engine-specific and drawn schematically.

## Corrections made to the original bundle

Checked against the MAN B&W G60ME-C9.5-TII Project Guide (edition 1.0, 2018):

1. **Hydraulic power supply moved aft.** On engines with 8 cylinders or fewer, the mechanically driven HPS is at the aft end, driven by a step-up gear on the aft crank flange. The model had it at the fore end.
2. **Thrust bearing is the 240° segment type** for engines under 9 cylinders (the model drew a full 360° ring). Segments are now drawn ahead and astern of the collar.
3. **Servo-oil pressure is 300 bar** (was "≈ 200–300 bar, typical").
4. **Hydraulic pipes are single-wall** at 300 bar; only the fuel HP pipes are double-walled. The KB said all HCU pipes were double-walled.
5. **Turbocharger options named** for 7 cylinders at L1: 1 × MAN TCA77, ABB A180-L or MHI MET83MB.
6. **Auxiliary blowers** are integrated in the scavenge-air cooler, drawing air from after the cooler.
7. **Assembly selection fixed.** *Deck cranes* owned no meshes of its own (every crane mesh matched a more specific entry such as the jib or pedestal), so selecting it highlighted nothing. An entry now selects its own meshes, and only an entry with none of its own falls back to the whole assembly under it. The HPS no longer frames the whole engine: the full-length servo-oil rail was inheriting the HPS entry from its parent group and is now matched to the high-pressure pipes entry.
8. **The research notes contradicted each other on cylinder distance** (1,040 vs 1,080 mm). No published value for the G60ME-C9.5 was found; 1,080 mm (from the C10.5) is kept and marked estimated.

Added: expert notes on 22 parts (SFOC tuning, derating, CPR rings, FIVA vs ELFI/ELVA, SOLAS emergency power, FSS CO₂ quantities, BWM D-2 limits and more), source keys per entry, and the turbocharger rotor speed now follows engine load.

## Architecture

```
src/
  app/                      App Router pages; (studio) route group keeps one WebGL canvas alive across /ship, /engine, /diagrams
  components/
    viewer/Viewer.tsx       R3F canvas + imperative SceneController (picking, highlight, x-ray, isolate, section cut, camera flights)
    studio/                 Top bar, contents index, study card, engine controls, view presets, search, URL sync
    physics/                Cycle panel and SVG charts
    diagrams/               Animated flow diagrams
    cover/ShipElevation.tsx Clickable elevation drawing
  lib/
    models/                 Procedural three.js ship, engine and materials (original geometry, corrected)
    data/kb.json            178 knowledge-base entries in 11 systems, with sources
    data/diagrams.json      Diagram nodes, links and media
    physics/cycle.ts        Engine cycle model
    store.ts                Zustand state; the URL is the source of truth for mode and selected part
    runtime.ts              Per-frame values shared with HTML readouts without re-rendering React
```

Design decisions:

- **The URL drives state.** `RouteSync` reads the path and `?part=` and updates the store, so back/forward, deep links and search all go through the same path.
- **Geometry is procedural** and generated in the browser (no model files to download). The builders are kept as plain JavaScript with `.d.ts` declarations.
- **The camera respects the panels.** A projection view offset keeps the model centred in the screen area left free by the contents, study card and cycle panel. Camera flights and view presets fit the target into that free area, and phones in portrait use the narrower horizontal field of view.
- **Engine-room parts are made visible.** Flying to a part inside the hull switches on x-ray and fades every other chapter (undo with *Show all systems* on the study card).
- **Confidence marks** (published, typical, estimated) appear on every entry and on the cover particulars.

## Knowledge base format

```jsonc
{
  "id": "me_hps", "sys": "engine", "name": "Hydraulic power supply (HPS)",
  "match": ["hydraulic_power_supply"],              // exact mesh/group names, or "/regex/"
  "fn": "…", "loc": "…",                             // Essentials
  "spec": [["Servo pressure", "300 bar"]], "ops": ["…"],  // Engineer
  "deep": ["…"], "src": ["man_pg"],                  // Expert
  "conf": "published", "diagram": "lo"
}
```

Match order matters: exact names first, then regexes in the order entries are declared.

## Limits

- Hull lines, tank layout, engine-room arrangement, and many engine dimensions are estimated. The ship's actual SMCR is not published.
- The main engine type is taken from the gearless sister KMTC Surabaya and assumed for the geared version.
- For study only. Always follow the ship's own manuals, the engine maker's instructions and company procedures.
