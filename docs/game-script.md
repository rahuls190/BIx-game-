# Project Mayhem — Game Script

Dialogue and story script for Bix, Pack and the facility.
Level 1 lines are copied from the shipped game (`dist/game.js`). Level 2 is implemented; this document remains the full narrative source, while the game uses the compact subset needed during play.

## Cast and voice

| Speaker | Who | Voice |
|---|---|---|
| **BIX** | Maintenance technician. Playable. | Tired, deadpan, practical. Short lines. |
| **PACK** | Robot backpack companion. | Cheerful, literal, dry. Reports disasters as status updates. |
| **VELA** | Facility dispatcher AI (over comms). | Flat and bureaucratic. Assigns work, never helps. |
| **SUPERVISOR** | Automated furnace supervisor (Level 2 only). | Polite and procedural, and completely certain Bix and Pack are scrap. |
| **SYSTEM** | HUD messages (checkpoints, locked doors). | Plain and short. |

## Writing rules

- Dialogue appears in the compact HUD box, so keep lines to about 70 characters (two short lines at most).
- One joke per line. Pack delivers it, Bix deflates it.
- Hazard lines fire only after the player has seen the hazard once. Never explain a hazard before teaching it.
- Death lines are one sentence, never repeated back to back, and never blame the player harshly.
- VELA gives orders. Pack gives commentary. Bix gives the punchline or the sigh.

---

# LEVEL 1 — The Broken Line (shipped)

**Premise:** one routine relay repair. The building has other plans.

## Opening

- **VELA:** One relay. Twenty minutes. Try not to improve anything.

## Story beats (trigger lines)

| # | Area | Speaker | Line |
|---|---|---|---|
| 1 | Test Bay | PACK | Morning, Bix. Today's repair is rated "impossible to misunderstand." |
| 2 | Lift Shaft | PACK | The lift appears to be taking a personal day. |
| 3 | Broken Line | PACK | Good news: the bridge is still here. Bad news: mostly as a concept. |
| 4 | Power Relay | BIX | Battery, socket, door. Finally, a problem with manners. |
| 5 | Escape Route | PACK | Structural update: the structure has left the meeting. |
| 6 | Hub Return | PACK | A door! Unfortunately, it leads to more building. |
| 7 | Coolant Run | PACK | Temperature: unnecessarily dramatic. |
| 8 | Pressure Deck | BIX | The blasts have timing. Bad timing, but timing. |
| 9 | Assembly Line | VELA | Three breakers unlock the emergency lift. Naturally, none are near it. |
| 10 | Reactor Spine | PACK | Reactor spine ahead. Avoid becoming a cautionary diagram. |
| 11 | Last Lift | PACK | Emergency lift located. Emergency also located. |
| 12 | Shift Exit | PACK | The exit is real. I checked twice. Once emotionally. |

## Puzzle and pickup lines

| Moment | Speaker | Line |
|---|---|---|
| Cog 1–11 collected | PACK | Cog *N* secured. |
| All 12 cogs | PACK | All cogs recovered. Suspiciously competent. |
| Battery reaches socket | PACK | Power restored. The door is pretending this was its idea. |
| Breaker 1 or 2 | PACK | Breaker *N*/3 online. |
| Breaker 3 | PACK | All breakers online. The lift has reluctantly agreed to exist. |
| Blocked relay door | SYSTEM | Relay door requires power |
| Blocked exit lift | SYSTEM | Lift locked · breakers *N*/3 |
| Checkpoint | SYSTEM | Checkpoint · *NAME* (Power Relay, Pressure Deck, Reactor Spine, Last Lift) |

## Death lines

| Cause | Speaker | Line |
|---|---|---|
| Fall | PACK | Gravity remains fully operational. |
| Molten vent | PACK | Molten metal: one. Bix: professionally toasted. |
| Laser | PACK | Laser calibration complete. Bix remains surprisingly solid. |
| Spikes | PACK | Sharp observation: those are spikes. |

## Results screen — "Barely Authorized"

- All 12 cogs: Pack upgraded the report from "accident" to "suspiciously effective."
- Fewer cogs: Shift complete. Several cogs are pursuing independent careers.

---

# LEVEL 2 — The Furnace Below (proposed)

**Premise:** Bix and Pack descend beneath the factory to repair the cooling system. The repair wakes the furnace supervisor, which decides they are scrap metal.

**Arc:** routine repair → small mistake → the supervisor wakes → recycling cycle → escape.

## Opening (the lift descends)

- **VELA:** Cooling fault below the floor plan. Naturally, below the floor plan.
- **PACK:** Good news: we're recyclable.
- **BIX:** Find less good news.

*(This exchange is fixed by the design brief.)*

## 1 · Broken Lift — safe training (2 min)

Teaches vents and hanging with nothing lethal. No death lines here yet.

| Trigger | Speaker | Line |
|---|---|---|
| Landing | PACK | We have arrived. The lift has retired. |
| First ledge | BIX | Ledges down. That's new. |
| First vent, before any risk | PACK | Vent on a timer. Watch it once. Then respect it. |
| First hang-and-climb | PACK | You're dangling. Professionally. |
| Area exit | VELA | Pumps are three levels down. Do not wake anything. |

## 2 · Casting Hall — molds and blasts (3–4 min)

Pack's **Scan** role: his eye turns amber before a blast.

| Trigger | Speaker | Line |
|---|---|---|
| Enter hall | PACK | Scanner online. I'll tell you when it's about to hurt. |
| First amber warning | PACK | Amber eye. That's the "please don't" colour. |
| First mold ride | BIX | It's a moving platform. Made of moulds. |
| Mold and blast combined | PACK | Timing and balance. Two skills, one Bix. |
| Optional cog route | PACK | That cog is in a bad place. I approve. |
| Checkpoint | SYSTEM | Checkpoint · Casting Hall |

## 3 · Cooling Works — two routes, two valves (4–5 min)

Pack's **Operate machinery** role: ACT at a terminal.

| Trigger | Speaker | Line |
|---|---|---|
| Enter pump room | VELA | Restore both coolant valves. Order is your problem. |
| First terminal | PACK | Terminal! Let me stick an arm in that. |
| ACT label appears | SYSTEM | ACT · Open |
| Gate opens | PACK | Open. You're welcome. |
| Valve 1 restored | PACK | Valve 1 of 2. Pressure is thinking about it. |
| Valve 2 restored | PACK | Coolant flowing. The pipes seem relieved. |
| Both valves done | SUPERVISOR | Unscheduled activity detected. Beginning inspection. |
| Reaction | BIX | Inspection. That's a nice word for it. |
| Checkpoint | SYSTEM | Checkpoint · Cooling Works |

**Story turn:** the repair works. That is what wakes the furnace supervisor.

## 4 · Scrap Sorter — the supervisor hunts (3–4 min)

Pack's **Carry a power cell** role. Lasers and conveyors, taught one at a time.

| Trigger | Speaker | Line |
|---|---|---|
| Enter sorter | SUPERVISOR | Two unclassified objects. Classification: scrap. |
| | PACK | It classified us in under a second. That's efficiency. |
| Power cell pickup | PACK | Cell secured. It's in my chest. Don't think about it. |
| Cell installed | PACK | Socket charged. It's the little things. |
| First laser gate | PACK | Laser gates. Marked in red so we can be sad on time. |
| Service tunnel | PACK | I fit in the tunnel. You do not. Interesting problem. |
| Pack opens machinery | BIX | Do the thing. |
| | PACK | Doing the thing. |
| Checkpoint | SYSTEM | Checkpoint · Scrap Sorter |

## 5 · Furnace Escape — rising heat (3–5 min)

Pack's **Hold the exit open** role. Three cooling shutters on the way up.

| Trigger | Speaker | Line |
|---|---|---|
| Enter chamber | SUPERVISOR | Beginning routine recycling cycle. |
| | BIX | Routine. Right. |
| Heat begins to rise | PACK | Heat is rising. That's technically its hobby. |
| Shutter 1 open | PACK | Shutter 1 of 3. Cooling responds. Sulkily. |
| Shutter 2 open | PACK | Shutter 2. The supervisor has stopped being polite. |
| Safe ledge | PACK | Resting ledge. I recommend resting quickly. |
| Failing shutter | PACK | I've got it! I can't hold it long. Go, go, go! |
| Bix reaches override | BIX | Override's in. Get back here. |
| Pack returns | PACK | Coming. I only slightly regret that. |
| Shutter 3 open | SYSTEM | Cooling shutters restored |
| Boarding the lift | SUPERVISOR | Recycling cycle terminated. Scrap has left the building. |
| | PACK | It called us scrap, Bix. Just once more. |

## Enemy lines

Each enemy gets one introduction line the first time it appears, then short reactions.

| Enemy | Moment | Speaker | Line |
|---|---|---|---|
| Scrap Crawler | Sealed bay, Area 1 | PACK | Something in there is pacing. It has opinions about metal. |
| | First real one | PACK | That's the pacer. It found the door. |
| | Pinged | PACK | Napping. Briefly. Go. |
| Slag Spitter | First sighting | PACK | Wall turret. It throws molten metal in a very tidy arc. |
| | After one arc lands | BIX | Same spot every time. That's almost polite. |
| Sorter Claw | First sighting | PACK | It picks a lane before it drops. Be in the other lane. |
| | Near miss | PACK | It grabbed the air where you were. Rude and slow. |
| Cinder Wasp | First sighting | PACK | Embers with intent. Do not stand still and admire them. |
| | Cleared by mist | PACK | The mist ate them. Finally, weather on our side. |
| The Supervisor | First beam sweep | SUPERVISOR | Classification beam active. Hold still for accurate sorting. |
| | Reaction | BIX | Absolutely not. |
| | Beam stalls on a shutter | PACK | It stalled. That's your two seconds. Use them. |

## Pack's ping (one charge, shared with the catch)

| Moment | Speaker | Line |
|---|---|---|
| Ping available | SYSTEM | ACT · Ping |
| Ping used | PACK | Zapped. That was my only charge, by the way. |
| Ping used, no catch left | PACK | Reminder: I cannot catch you now. No pressure. |
| Recharged at checkpoint | PACK | Recharged. One favour, your choice which. |

## Emergency catch (Pack rescues Bix, once per checkpoint)

| Moment | Speaker | Line |
|---|---|---|
| Catch | PACK | Got you. That counts as overtime. |
| Second miss in same section | PACK | Catch used. Please stop testing me. |
| Optional | BIX | Noted. |

*(Fixed by the design brief: "That counts as overtime.")*

## Checkpoints (SYSTEM)

Casting Hall · Cooling Works · Scrap Sorter · Furnace Escape

## Cog lines (optional harder routes)

| Cogs | Speaker | Line |
|---|---|---|
| 1–7 | PACK | Cog *N* secured. |
| First optional cog | PACK | Optional and dangerous. My favourite kind. |
| All cogs | PACK | All cogs recovered. The supervisor would call that theft. |

## Death lines (Level 2)

| Cause | Speaker | Line |
|---|---|---|
| Fall / missed jump, no catch left | PACK | Catch is on cooldown. Gravity is not. |
| Molten blast | PACK | Bix has been recast. Not to specification. |
| Laser gate | PACK | Laser gate: one. Bix: sliced. Diplomatically. |
| Conveyor / crusher | PACK | Sorted. Unfortunately, as scrap. |
| Rising heat | PACK | It got hot. It was always going to get hot. |
| Supervisor contact | SUPERVISOR | Classification confirmed. |

## Results screen — "Recycled, Officially"

- All cogs: Pack has filed this as "reclaimed with distinction."
- Fewer cogs: Shift complete. Several cogs have been reclassified as landfill.
- Zero catches used: Pack asks for a raise in overtime.
- Catch used several times: Pack reports "a lot of overtime."

---

## Continuity notes

- VELA is cold to the point of comic. By the finale she says nothing at all when Bix escapes the furnace, and Pack notes it.
- The supervisor never gets angry. It is polite the whole time, and that is the scary part.
- Pack's "Good news / Bad news" pattern is his signature. Use it once per level opener and once in the finale.
- Level 1 ends by boarding the emergency lift. Level 2 opens with the lift passing the floor it should stop at.

## Remaining story decision

- Decide whether VELA returns in Level 2 as the same dispatcher or is cut off by the Supervisor's takeover.

The Supervisor is a visible gantry-mounted head unit, and Pack's backpack-to-hover transition is implemented in the Level 2 animation sheet.
