# Level 7 - Clocking In

Status: **plan plus visual-development graphics**. The complete ComfyUI concept pack is generated under `design/level7-art-comfy/production`. Do not create Level 7 game code, landing-page integration, progress rules, tests, or publishing changes until implementation is approved.

Level 7 opens the second world. It begins immediately after Mother Cluckzilla is fed and put to bed. The Agri-Dome is quiet, the feed line is off, and Bix follows the door mentioned in Level 6's final line.

Target first-clear time: **22-30 minutes**. Clean replay: **10-14 minutes**.

## 0. Verified Level 6 baseline

This plan was checked against the published GitHub `main` source at commit `4d8d2a9ecebb0cb1b3c97882fa2251241ffe83ad`. The local checkout and GitHub `main` resolve to the same commit.

Level 7 must preserve these live facts:

- Level 6 is the World One finale and contains six areas across 26,000 world pixels.
- Its first-clear target is 18-25 minutes, with 15 cogs, seven checkpoints, and four optional story slips.
- The final sequence feeds Mother Cluckzilla, settles her safely into the bedding cart, shuts off the feed line, and leaves the dome quiet for the first time in eleven years.
- Bix's final live line is: **Come on. There is a door up there somewhere.**
- The BX-7 thread is still unresolved. Level 6 only confirms that an alarm test sheet was last signed by BX-7.
- Pack has one emergency catch charge. A catch returns Bix to the current checkpoint, spends the charge, and checkpoints refill it.
- Movement physics and established controls remain the campaign standard. Level 7 may recombine them but must not silently change their feel.
- The progression system banks each level's best cog result and uses approximately half of the preceding total to unlock the next level.
- Feed pods, hoppers, troughs, irrigation columns, and Mother Cluckzilla remain Level 6-specific. They do not become Level 7 inventory or recurring hazards.

## 1. The promise

Bix and Pack leave the industrial facility and enter the abandoned civic district above it. The city is not destroyed. It is clean, maintained, and running an eleven-year-old morning routine for people who are no longer there.

A public terminal recognizes Bix:

> EMPLOYEE BX-7. LATE ARRIVAL RECORDED. SHIFT RESUMED.

Level 7 does not explain everything that happened eleven years ago. It makes one fact unavoidable: **BX-7 is Bix's employee identity, and the city has been waiting for him.** The deeper question - why Bix does not remember and why Pack does - remains open for World Two.

Tone: quiet civic unease, dry workplace comedy, and relief after the scale of Level 6. The danger comes from systems faithfully starting a normal workday with nobody left to supervise them.

## 2. Signature mechanic: The Link

Pack can be deployed as a wireless relay anchor.

- Tap **ACT** at a relay socket to leave Pack connected there.
- Machinery inside the socket's signal field becomes active: bridges extend, lifts move, doors listen, and dormant signs reveal routes.
- Bix can travel away from Pack while the link remains stable.
- Tap **ACT** at a return terminal, or hold ACT when close enough, to recall Pack.
- Pack cannot provide an emergency catch while deployed. The HUD must say **PACK LINKED - NO CATCH**.
- A cyan tether line shows the active path through relay repeaters. Never rely on colour alone: repeaters use a linked-chain symbol and an audible pulse.
- A relay puzzle can never permanently strand Bix or Pack. A nearby reset terminal restores the last safe arrangement.

The Link deepens Pack Assist from Level 2 instead of replacing it. Mechanically, it asks the player to decide when Bix can safely continue without his companion. Narratively, it makes every separation between them visible.

### Controls

The level introduces no new keyboard or touch button.

| Action | Keyboard | Touch |
|---|---|---|
| Deploy or recall Pack | E / Enter | ACT |
| Move | A/D or arrows | Joystick |
| Jump / climb | Space | Jump |
| Magnet Blue / Red | Z / X | Existing glove buttons |
| Shield | C or Shift | Existing shield control |

The Magnet Glove remains available. The carried core and feed pods do not continue as inventory; one empty pod appears near the opening door as a quiet visual callback.

## 3. Route

About **27,500 world pixels** arranged as a continuous sawtooth route. Every area changes elevation at least twice, and no challenge lane remains flat for more than one screen. The player repeatedly climbs above the civic route, drops into service spaces, crosses back through the public level, and finishes by rising from beneath the tracks onto the departing train.

| # | Area | Approx. range | Purpose | Pressure |
|---|---|---:|---|---|
| 1 | **Dome Exit** | 0-3,000 | Descend from the dome roof, cross the civic ledge, then climb to the BX-7 terminal | low |
| 2 | **Civic Intake** | 3,000-7,000 | Three-floor deploy tutorial: basement power, lobby crossing, mezzanine recall | medium-low |
| 3 | **Relay Court** | 7,000-12,000 | W-shaped route through two repeaters, rotating bridges, and paired enemies | medium-high |
| 4 | **Archive Spine** | 12,000-17,500 | Four-storey vertical relay climb with counterweight descents and blackout routing | high |
| 5 | **Ghost Platform** | 17,500-23,000 | Roof-to-concourse-to-roof tram chase with moving Link hand-offs | very high |
| 6 | **First Train** | 23,000-27,500 | Service-pit descent, signal-gantry ascent, train-roof crossing, and boarding | high finale |

### Area 1 - Dome Exit

- Begin in the warm amber-green light of the Agri-Dome, then step into cool morning daylight.
- Mother Cluckzilla is heard settling behind the sealed door. She is safe and does not return as a hazard.
- The route drops down the dome's exterior maintenance stairs, crosses a suspended service cradle, then climbs one storey to the civic terminal. This establishes the up-down rhythm without pressure.
- A dead civic terminal wakes when Pack approaches and identifies Bix as BX-7.
- The first checkpoint is after the terminal, so the reveal is never repeated on every failure.

### Area 2 - Civic Intake

- One basement relay socket powers a lift and two staggered bridge halves.
- Bix deploys Pack below street level, rides the lift to the lobby, drops through a ticket-control shaft to reverse a bridge, then climbs to a mezzanine return terminal.
- The first gaps are deliberately forgiving. Missing one drops Bix to a recovery conveyor that returns him to the basement socket without spending a life.
- A slow Turnstile Ram crosses the lobby after the bridge lesson. The player can jump it, shield against it, or use Blue to hold its bumper against a magnetic stop.
- A maintenance sign states the complete rule in-world: **LINKED UNITS CANNOT PROVIDE FALL ASSISTANCE**.

### Area 3 - Relay Court

- The signal must pass through two repeaters to reach a rotating pedestrian bridge.
- Blue pulls a repeater carriage toward Bix; Red pushes it along its rail.
- The required route forms a W: descend to move repeater one, climb the west bridge, drop through the central inspection booth, then ascend the east bridge.
- The upper route keeps Pack with Bix but combines a rotating wall, a retracting stair, and precise glove movement. The lower route has wider surfaces but leaves Pack deployed longer and pairs a Street Sweeper with a Ticket Drone.
- A hand wheel rotates the central bridge manually while Pack powers the lock. The player must choose the bridge angle before leaving Pack, making the environment itself part of the route plan.
- The optional cog teaches that signal fields can overlap.

### Area 4 - Archive Spine

- A four-storey civic records tower. Bix climbs two floors while Pack remains linked below, rides a counterweight down one floor to redirect power, then climbs the opposite side of the shaft.
- Each transfer creates a short blackout. Emergency strips show the safe ledge before the lights drop.
- Service Clamps travel on ceiling rails and lock whichever ladder or lift they reach. Red retracts a clamp; Blue pulls its carriage to a harmless bay. Later rooms pair one clamp with a blackout, never two new rules at once.
- Two archive shutters can be opened in either order, creating a clockwise or counter-clockwise loop around the central shaft. Both routes rejoin at the memory terminal.
- Archive fragments reveal that BX-7's shift was never closed, but do not explain the missing eleven years.
- The final terminal plays one damaged frame of Bix entering the facility with a newly issued Pack unit.

### Area 5 - Ghost Platform

- A tram yard runs its empty morning schedule.
- Pack must hold a signal at one end while Bix rides a moving tram roof, drops through an open carriage into the lower concourse, and climbs a maintenance ladder to a second roof.
- Sweepers push loose objects, Ticket Drones close marked landing zones, and one Signal Auditor rides the active tether toward Pack. A Pack ping reverses the Auditor, while moving a repeater sends it down the unused branch.
- The centre sequence alternates height every 8-12 seconds: tram roof, hanging sign, platform floor, service tunnel, opposite roof. No two consecutive jumps travel in the same direction.
- The hardest optional route lets the player recall Pack in mid-ride and regain the emergency catch before the final jump.

### Area 6 - First Train

- Bix first drops beneath the departure platform to power the route board, climbs a moving luggage lift to the signal gantry, crosses the train roof, then descends through an emergency hatch to the boarding door.
- Bix powers three departure systems: route board, platform gate, and traction relay. Each changes the geometry of the next stage rather than merely opening a door.
- The finale combines a Turnstile Ram below, a Service Clamp on the gantry, and a Ticket Drone on the roof. They activate one at a time, then overlap for a short final ten-second sequence with a guaranteed safe pocket.
- The route board reads the five fragments collected across the level. All five combine into: **BX-7, DO NOT CLOCK IN.** Missing fragments produce a visibly incomplete warning.
- The city overrides her warning and opens the train anyway.
- Bix boards with Pack. The departure board changes from **11 YEARS DELAYED** to **ON TIME**.
- End on the train entering the bright city, with the next district visible but unnamed.

## 4. Hazards and enemies

This is the first level after a world finale. It has no conventional boss, but its challenge comes from combining small civic systems across changing elevation.

| Hazard | Readable rule | Counter |
|---|---|---|
| **Street Sweeper** | Follows a painted cleaning lane; amber beacon flashes before a push | Step outside the lane or raise the shield |
| **Ticket Drone** | Scans one platform sector, then closes its gate | Move during the scan sweep or power a side gate with Pack |
| **Turnstile Ram** | Charges only along a marked horizontal rail after its barrier flashes twice | Jump, shield, or pull its magnetic bumper into a stop |
| **Service Clamp** | Travels on an overhead rail and locks a ladder, lift, or relay carriage | Red retracts it; Blue parks it in an empty maintenance bay |
| **Signal Auditor** | Appears on the cyan tether and travels toward Pack before interrupting the Link | Pack ping reverses it, or reroute the tether through an unused branch |
| **Signal Drop** | Tether flickers and the linked-chain icon breaks before machinery resets | Reach a safe surface or reconnect through a repeater |
| **Tram Roof Gap** | Route board announces the carriage separation before it opens | Change roofs or use Blue to pull the service plate closed |
| **Archive Blackout** | Three amber pulses, then lights drop for a fixed interval | Memorize the safe ledge; Pack highlights the next socket |

No enemy follows Bix through a checkpoint. No hazard activates without an amber tell. The city systems are procedural, not malicious. Required routes introduce each enemy alone before combining it with another; optional routes can combine up to three systems for expert play.

## 5. Progression

- Level 7 unlocks after **completing Level 6 and carrying 40 of the 80 cogs available in Levels 1-6**. This preserves the campaign's half-total cog rule while preventing players from skipping the World One ending.
- A player who completes Level 6 below 40 carried cogs receives a direct replay choice and a clear count of the remaining cogs needed. No individual level is mandatory for filling the gap.
- Earlier cogs still set the Magnet Glove shield tier.
- Level 7 contains **15 cogs**, bringing the running maximum from 80 to 95.
- A better result replaces the saved Level 7 best and can never reduce the carried total.
- Five **shift fragments** replace delivery slips as story collectibles. They do not affect the main unlock.
- Collecting all five fragments opens a short post-level archive replay from the results screen.

### Medal targets

| Medal | Cogs | Falls | Time |
|---|---:|---:|---:|
| Gold | 12+ | 8 or fewer | 20:00 or faster |
| Silver | 7+ | 20 or fewer | 28:00 or faster |
| Bronze | Finish | any | any |

## 6. Checkpoints and failure rules

- **9 checkpoints:** after the BX-7 terminal, after Civic Intake, at the Relay Court observation point, after the Court merge, halfway up Archive Spine, after the Archive memory scene, at Ghost Platform entry, before the final train sequence, and on completion.
- A checkpoint records relay state, repeater positions, opened gates, collected fragments, and the current Pack location.
- Respawn never leaves Pack behind an unpowered gate.
- If Bix falls while Pack is deployed, the normal catch is unavailable and the HUD must have warned the player before the jump.
- Reset terminals restore the current puzzle only. They never remove collected cogs or fragments.

## 7. Story beats

1. **Recognition:** the first civic terminal calls Bix BX-7.
2. **Deflection:** Pack says it is probably a database collision. His lens closes while he says it.
3. **Separation:** the Link forces Bix to leave Pack behind for the first time by choice.
4. **Evidence:** the Archive Spine shows Bix and Pack entering together eleven years ago.
5. **Warning:** VELA's broken message says not to clock in.
6. **Choice:** Bix boards the train anyway because the city has the answer and because walking back into the dome would not make the question disappear.

### Sample dialogue

| Moment | Speaker | Line |
|---|---|---|
| Dome door opens | PACK | Good news: morning. Bad news: it appears to be eleven years late. |
| Terminal recognition | SYSTEM | Employee BX-7. Late arrival recorded. Shift resumed. |
| Bix reacts | BIX | That is not my name. |
| Pack deflects | PACK | It is adjacent to your name. Bureaucratically. |
| First deployment | PACK | I can hold the link. You will not have the catch while I do. |
| Archive image | BIX | That is me. |
| Archive image | PACK | Yes. |
| Archive image | BIX | You knew. |
| Archive image | PACK | I remembered. That is not the same thing. |
| VELA fragments combine | VELA | BX-7, do not clock in. |
| Train opens | BIX | We are already late. |

## 8. Art direction

Follow `design/ART-DIRECTION.md` and the canonical Bix/Pack references.

Level 7 must not look like Levels 3-4 steel interiors, Level 5's storm-grey skyline, or Level 6's warm agricultural dome.

**Own visual identity:** abandoned civic modernism at early morning.

- Pale concrete, faded mint enamel, oxidized aluminium, dirty glass, route-map yellow, and restrained cyan signal light.
- Long cool shadows with clean sunlight entering from the city side.
- Old public signage, timetable boards, ticket barriers, civic planters, rain marks, and carefully maintained empty platforms.
- Hazard red remains exclusive to immediate danger.
- Signal links use cyan plus the chain symbol; broken links use amber plus a separated-chain symbol.
- No generic neon cyberpunk city, blue-purple sci-fi glow, spotless utopia, or crowded apocalypse debris.

Generated visual-development families:

1. Six area backdrops.
2. Civic platform and architecture atlas.
3. Relay socket, repeater, return terminal, bridge, gate, and tram props.
4. Street Sweeper, Ticket Drone, Turnstile Ram, Service Clamp, and Signal Auditor animation sheets.
5. Signal tether, link pulse, blackout, and route-board effects.
6. Landing card showing Bix separated from Pack by an active relay field.

Target all Level 7 runtime art at **under 5 MB**, WebP where transparency and browser quality permit, with only the versions actually loaded by the game shipped in `dist/`.

## 9. Audio direction

- Dawn wind through concrete streets.
- Distant empty-tram movement and rail expansion clicks.
- Relay pulse: short mechanical carrier tone, not a magic hum.
- Pack deploy and recall have matching outward/inward motifs.
- Public-address announcements are dry and close, with no horror treatment.
- During the Archive image, ambience drops almost completely; Pack's small lens servo is the loudest sound.

## 10. Accessibility and mobile

- Every signal state uses colour, icon, motion, and text together.
- The tether remains visible against bright sky and dark interiors.
- ACT labels name the exact consequence: **DEPLOY PACK**, **TRANSFER LINK**, **RECALL PACK**, or **RESET RELAY**.
- Mobile never requires ACT and a glove button at the same instant.
- Moving-tram jumps use the established tap-jump limits and must be tested at 30, 60, 120, 144, and 240 Hz.
- Reduced-motion mode replaces tether pulses and board flicker with steady states.

## 11. Character and system roles

Every role has one gameplay job and one story job. A character or system should not take over another role merely to create a new obstacle.

| Role | Gameplay responsibility | Story responsibility | Must do | Must not do |
|---|---|---|---|---|
| **Bix / player** | Move, jump, climb, route-plan, activate terminals, and choose when to lose Pack's catch in exchange for power | Question the BX-7 identity and decide to pursue the truth | Remain mechanically capable while separated from Pack | Gain weapons, combat attacks, or a health bar |
| **Pack** | Catch falls, scan systems, serve as the Link relay, warn about timing, and return when recalled | Protect Bix while revealing that he remembers more than he previously admitted | Make every deploy state and recovery route clear | Solve jumps automatically or conceal critical rules |
| **VELA** | Deliver five optional memory fragments | Establish that Bix was warned not to resume the old shift | Speak through incomplete archival records | Become a full exposition narrator or identify the Level 8 antagonist |
| **Civic system** | Control gates, bridges, transit boards, scanners, and the final train | Treat Bix as BX-7 with unsettling administrative certainty | Be consistent, procedural, and readable | Behave like a supernatural villain |
| **Street Sweeper** | Create a slow, lane-based moving obstacle | Show that the city is still following an obsolete routine | Telegraph its sweep and provide a safe crossing rhythm | Chase Bix off route or damage him without warning |
| **Ticket Drone** | Scan marked zones and temporarily reset an active relay link | Turn ordinary public infrastructure into pressure | Show scan cones and lock-on timing before disruption | Cause instant failure or permanently remove Pack |
| **Turnstile Ram** | Control one horizontal lane and test jump, shield, or magnetic timing | Show access control continuing without passengers | Charge only on its painted rail after two visible flashes | Turn corners, pursue Bix, or attack off-screen |
| **Service Clamp** | Temporarily lock a climbable or powered object | Make ordinary maintenance machinery reshape the route | Always expose a magnetic carriage and a harmless parking bay | Grab Bix, hide its target, or block the only reset path |
| **Signal Auditor** | Travel along the active Link and force a ping or reroute decision | Show the city inspecting Bix's unauthorized relay use | Remain visible on the tether and pause before interruption | Leave the tether, become a projectile, or disable Pack permanently |

### Player-role contract

- Bix is a repair technician and traversal specialist, not a fighter.
- Pack is a companion and a limited resource, not a weapon.
- Failure comes from timing, routing, or an interrupted system state, never surprise damage.
- The player's meaningful choice is **safety now versus access ahead**: keep Pack for the catch, or deploy him to power the route.
- Every forced separation must visibly show where Pack is, what he is powering, and how he will return.

## 12. Complete layout specification

The level is a sawtooth journey of approximately **27,500 world pixels**. Horizontal progress remains readable, but the playable route changes vertical direction every 600-1,000 world pixels. Each area includes at least one descent, one climb, one interactive route-changing machine, and one overlook that previews the next destination. Alternate routes rejoin before checkpoints so the save state remains reliable.

### Global route

**Dome Exit -> Civic Intake -> Relay Court -> Archive Spine -> Ghost Platform -> First Train**

Target first-clear time is **22-30 minutes**. A confident replay should take **10-14 minutes**. A complete collectible run should take **27-35 minutes**.

### Area matrix

| Area | Range | Target time | Difficulty | Checkpoints | Cogs | VELA fragments | Primary purpose |
|---|---:|---:|---:|---:|---:|---:|---|
| 1. Dome Exit | 0-3,000 | 2-3 min | 1.5/5 | CP1 | 2 | 1 | Establish elevation changes and BX-7 recognition |
| 2. Civic Intake | 3,000-7,000 | 4-5 min | 2.5/5 | CP2 | 2 | 0 | Teach the Link across basement, lobby, and mezzanine |
| 3. Relay Court | 7,000-12,000 | 4-5 min | 3.5/5 | CP3, CP4 | 3 | 1 | Route a W-shaped relay path under paired pressure |
| 4. Archive Spine | 12,000-17,500 | 5-6 min | 4.5/5 | CP5, CP6 | 3 | 2 | Combine four-floor climbing, clamps, blackout, and evidence |
| 5. Ghost Platform | 17,500-23,000 | 5-6 min | 5/5 | CP7 | 3 | 1 | Master moving Link hand-offs across multiple elevations |
| 6. First Train | 23,000-27,500 | 3-5 min | 4.5/5 | CP8, CP9 | 2 | 0 | Combine enemies and machines in a vertical departure run |
| **Total** | **27,500** | **22-30 min** | - | **9** | **15** | **5** | - |

### Area 1: Dome Exit, 0-3,000

| Segment | Range | Layout and purpose |
|---|---:|---|
| Quiet bedding door | 0-500 | Begin beside the sleeping Mother Cluckzilla. No hazard, input pressure, or collectible. The player receives control in silence. |
| Exterior descent | 500-1,250 | Descend the dome shell on broad maintenance stairs, then cross one slow suspended cradle. Cog 1 sits on a short upward detour. |
| Civic climb | 1,250-2,050 | Climb through two offset terraces and use one magnetic shutter as a step. The terminal remains visible above throughout. |
| Employee terminal | 2,050-2,500 | Mandatory scanner recognizes BX-7. CP1 activates immediately after the line. VELA Fragment 1 sits in a side maintenance recess. |
| Relay overlook | 2,500-3,000 | Drop to the civic ledge, then climb a short ladder to view the dark intake bridge. Cog 2 rewards the upper overlook. |

Exit condition: the player understands that the city knows Bix and that Pack recognizes the relay hardware.

### Area 2: Civic Intake, 3,000-7,000

| Segment | Range | Layout and purpose |
|---|---:|---|
| Basement socket | 3,000-3,700 | Descend one floor to a safe socket. Deploying Pack powers the lobby lift and reveals the full signal radius. |
| Lobby lift | 3,700-4,450 | Ride upward, cross one bridge half, then drop through a ticket shaft to a recovery conveyor. Cog 3 sits on the lower return loop. |
| Reversing bridge | 4,450-5,350 | Pull a bridge counterweight with Blue, climb back to the lobby, and cross without catch. A fall returns to the conveyor. |
| Turnstile hall | 5,350-6,150 | First Turnstile Ram appears alone on a marked rail. Jump, shield, or pin its bumper to a magnetic stop. |
| Mezzanine recall | 6,150-6,700 | Climb to a return terminal, recall Pack, and use the restored catch to reach Cog 4 above the booth. |
| Court overlook | 6,700-7,000 | CP2 and a safe balcony showing Relay Court's W-shaped route. |

Exit condition: the player can explain deploy, radius, loss of catch, and recall without reading a tutorial again.

### Area 3: Relay Court, 7,000-12,000

| Segment | Range | Layout and purpose |
|---|---:|---|
| West descent | 7,000-7,800 | Observe a Street Sweeper from above, then descend behind cover. CP3 records the observation point. |
| Repeater one | 7,800-8,800 | Deploy Pack below, move a repeater carriage, and climb the powered west bridge. Cog 5 is on its moving crown. |
| Central drop | 8,800-9,700 | Rotate the bridge with a hand wheel, drop through its centre booth, and transfer the Link before a Ticket Drone scan. |
| Split ascent | 9,700-10,700 | Lower path pairs Sweeper and Drone on broad steps. Upper path uses a retracting stair and rotating wall for Cog 6 and Fragment 2. |
| East bridge | 10,700-11,500 | Ascend the second powered bridge while alternating between cover and exposed Link controls. |
| Merge terrace | 11,500-12,000 | Safe upper merge, Cog 7, Pack recovery terminal, and CP4 before the archive climb. |

Exit condition: the player can transfer the Link and respond to one enemy without confusing enemy pressure with relay failure.

### Area 4: Archive Spine, 12,000-17,500

| Segment | Range | Layout and purpose |
|---|---:|---|
| Archive intake | 12,000-12,700 | A quiet lobby, route map, and optional Cog 8 behind a powered information desk. |
| West stack | 12,700-13,800 | Climb two floors while Pack powers a lift below. Fragment 3 is visible across the central shaft. |
| Counterweight drop | 13,800-14,500 | Ride a counterweight down one floor, move the Link to the east socket, and park the first Service Clamp. CP5 follows the transfer. |
| Blackout loop | 14,500-15,500 | Choose either shutter, circle the central shaft, and cross three outlined ledges during fixed blackouts. Cog 9 sits on the safer loop. |
| East stack | 15,500-16,600 | Climb the opposite side while one clamp changes which ladder remains open. Cog 10 rewards redirecting it instead of waiting. |
| Memory terminal | 16,600-17,500 | Fragment 4 triggers the Bix image and Pack confrontation. CP6 records completion after dialogue. No hazard may interrupt the scene. |

Exit condition: the player has proof that BX-7 resembles Bix and knows Pack remembers the record.

### Area 5: Ghost Platform, 17,500-23,000

| Segment | Range | Layout and purpose |
|---|---:|---|
| Station hall | 17,500-18,300 | CP7, route-board preview, and one calm deploy-and-recall refresher. |
| Alternating scan | 18,300-19,200 | Two Ticket Drones scan high and low lanes. Cog 11 is in the slower concourse; Cog 12 is above the fast lane. |
| Tram roof | 19,200-20,200 | Board a maintenance tram, deploy Pack to power it, and climb across two roof levels while a Sweeper clears the lower deck. |
| Carriage drop | 20,200-21,000 | Drop through an open carriage, cross the service tunnel, and climb the opposite side as the tram continues moving overhead. |
| Moving hand-off | 21,000-22,300 | Transfer the Link between tram and platform while a Signal Auditor travels the tether. Fragment 5 and Cog 13 occupy an optional hanging-sign route. |
| Pre-finale rise | 22,300-23,000 | Recall Pack, climb from the track bed to the departure overlook, and preview the entire final vertical route. |

Exit condition: the player has performed the Link mechanic on moving geometry and has encountered every story pickup opportunity before the finale.

### Area 6: First Train, 23,000-27,500

| Segment | Range | Layout and purpose |
|---|---:|---|
| Route board | 23,000-23,700 | The five fragments combine into **BX-7, DO NOT CLOCK IN.** Missing fragments show an incomplete message. |
| Service-pit drop | 23,700-24,500 | Descend beneath the platform, pin a Turnstile Ram, and deploy Pack into the traction socket. Cog 14 sits behind the ram stop. |
| Luggage-lift climb | 24,500-25,300 | Ride and redirect two luggage lifts upward while a Service Clamp chooses which landing remains open. |
| Signal gantry | 25,300-26,100 | Cross above the train, reroute a Signal Auditor, and reach CP8 before the final timed sequence. |
| Train-roof run | 26,100-27,100 | A Ticket Drone, clamp, and opening roof gaps overlap for ten seconds, with one guaranteed safe pocket halfway. Cog 15 sits above the emergency hatch. |
| Boarding descent | 27,100-27,500 | Recall Pack, descend through the hatch, enter the carriage, and depart. CP9 records completion. |

Exit condition: the player chooses to follow the BX-7 trail despite the warning.

### Checkpoint rules

- Checkpoints save cogs, fragments, dialogue flags, relay state, and Pack ownership state.
- Respawn never places Bix outside the active relay radius or on moving geometry.
- Pack always returns to Bix after three failed recall attempts or any invalid relay state.
- Optional-route collectibles remain collected after a fall.
- The longest replay from a checkpoint to the previous failure point is **under 45 seconds**.

## 13. Difficulty plan

Level 7 should be harder than Level 6 in decision-making, but calmer in presentation and less punishing in movement. The challenge comes from planning around Pack's two mutually exclusive roles.

### Difficulty dimensions

| Area | Motor skill | Route reasoning | Timing pressure | Failure cost | Intended feeling |
|---|---:|---:|---:|---:|---|
| Dome Exit | 1/5 | 1/5 | 1/5 | Very low | Relief, curiosity |
| Civic Intake | 2/5 | 3/5 | 2/5 | Low | Understanding through movement |
| Relay Court | 4/5 | 4/5 | 3/5 | Low | Controlled pressure |
| Archive Spine | 4/5 | 5/5 | 4/5 | Medium-low | Doubt and spatial mastery |
| Ghost Platform | 5/5 | 5/5 | 5/5 | Medium | Competence under motion |
| First Train | 5/5 | 4/5 | 5/5 | Low after CP8 | Commitment and release |

### Teaching sequence

1. **Show:** Display an inactive system, its socket, and its destination together.
2. **Teach:** First deployment occurs on flat ground with no enemy or lethal fall.
3. **Test:** Require movement without Pack's catch across recoverable gaps.
4. **Combine:** Add relay transfer and one clearly telegraphed enemy.
5. **Twist:** Move the relay relationship onto a tram.
6. **Master:** End with one clean combined sequence without introducing a new rule.

### Timing targets

- Standard jump windows remain identical to Levels 1-6.
- First Ticket Drone scan warning: at least **1.5 seconds** before disruption.
- Later Ticket Drone scan warning: never below **0.9 seconds**.
- Street Sweeper safe opening: at least **2.0 seconds** on the required route.
- Tram roof gaps: at least **1.2 seconds** of stable approach time.
- Final train door: **8 seconds** on first attempt, **10 seconds** after one failure.
- Relay radius warning begins at 80% distance and becomes urgent at 95%.

### Failure and assist policy

- No one-hit surprise, off-screen failure, or checkpoint loss.
- A broken Link pauses the powered object for one second before resetting; it does not drop Bix instantly.
- Three failures in the same encounter enable an optional **Longer Signal Window** prompt.
- Five failures enable **Stable Moving Platforms** for that encounter.
- Assists do not remove cogs, story scenes, or completion credit.
- Assists are explicit settings, never invisible difficulty manipulation.

### Medal validation

The medal rules remain the campaign-style rules defined in Section 5:

- **Bronze:** finish the level by any valid route.
- **Silver:** collect at least seven cogs, finish with 20 or fewer falls, and finish within 28 minutes.
- **Gold:** collect at least 12 cogs, finish with eight or fewer falls, and finish within 20 minutes.
- Assists do not disqualify a medal; their purpose is access, not punishment.
- Collecting all five VELA fragments awards a separate **Full Warning** story commendation and is not part of medal calculation.

## 14. Pacing and emotional curve

| Time | Gameplay beat | Emotional beat | Narrative load |
|---:|---|---|---|
| 0:00-2:30 | Leave the dome and walk into daylight | Relief becomes uncertainty | One short Pack exchange |
| 2:30-5:30 | BX-7 scan and first Link tutorial | Recognition and unease | System line, then space to play |
| 5:30-10:00 | Relay Court and first enemies | Growing mastery | Fragment 2 is optional |
| 10:00-14:30 | Archive climb and blackout | Isolation and doubt | Environmental records only |
| 14:30-17:00 | Memory terminal | Personal confrontation | Main dialogue scene, then silence |
| 17:00-21:00 | Ghost Platform and tram | Forward urgency | Fragment 5, minimal speech |
| 21:00-24:00 | Warning, final relay, departure | Choice and resolve | VELA warning and final Bix line |

Pacing rule: no major dialogue plays during precision movement. Every story line either precedes the challenge, follows it, or occurs in a protected walking space.

## 15. Production roadmap

This roadmap records the future implementation order. Visual-development graphics are complete; it does not authorize game code, audio integration, publishing, or release changes in the current task.

### Phase 0: Creative approval

Deliverables:

- Approved title, theme, Link mechanic, story reveal, and ending.
- Decision on Pack's knowledge and the final train controller.
- Approved role boundaries and collectible totals.

Exit criteria: the recommended direction in Section 18 is confirmed, with no contradictory story or mechanic requirements.

### Phase 1: Paper layout lock

Deliverables:

- Final coordinate map for all six areas.
- Checkpoint, cog, fragment, relay, hazard, and alternate-route positions.
- Written state diagram for deploy, transfer, recall, break, reset, death, and checkpoint restore.

Exit criteria: every mandatory route is explainable step by step and every optional route rejoins before a checkpoint.

### Phase 2: Greybox prototype

Deliverables:

- Geometry-only playable route.
- Temporary Link states and relay radius indicators.
- Placeholder versions of all five civic enemies, first in isolation and then in the planned combinations.

Exit criteria: first-time players understand the Link within three minutes and can finish without developer guidance.

### Phase 3: Systems and difficulty validation

Deliverables:

- Final movement distances and timings.
- Complete checkpoint and recovery behavior.
- Assist settings and mobile control validation.
- Automated coverage for state restoration and frame-rate independence.

Exit criteria: no soft locks, unreachable Pack states, checkpoint loops, or frame-rate-dependent timing at 30-240 Hz.

### Phase 4: Narrative implementation

Deliverables:

- Final dialogue script and terminal copy.
- Five VELA fragments and incomplete-message variations.
- Dialogue replay rules and subtitle timing.

Exit criteria: story remains understandable with zero fragments, while all five add meaning without changing progression.

### Phase 5: Art and audio production

Deliverables:

- Approved environment, prop, enemy, character, effect, UI, and landing-page asset list.
- Final animation list and audio cue sheet.
- Performance budget and file-loading plan.

Exit criteria: assets match the canonical Bix and Pack references, all state changes remain readable, and the complete runtime art package stays under 5 MB.

### Phase 6: Integration and polish

Deliverables:

- Level-select unlock, progress saving, medal results, accessibility settings, and landing-page connection.
- Desktop and mobile polish pass.
- Full Level 6 ending to Level 7 opening continuity review.

Exit criteria: a returning Level 6 player enters Level 7 with correct progress, and a direct Level 7 load creates a valid default state.

### Phase 7: Release readiness

Deliverables:

- Regression report for Levels 1-6.
- Browser/device compatibility report.
- Final asset, performance, accessibility, and narrative sign-off.
- Release notes and rollback point.

Exit criteria: all acceptance criteria in Section 16 pass and no critical or high-severity issue remains.

## 16. Acceptance criteria

### Gameplay

- The six areas are playable in order with no unclear mandatory objective.
- Deploy, transfer, recall, signal break, and checkpoint restore all have distinct feedback.
- Pack cannot be permanently lost, duplicated, or recalled into invalid geometry.
- Every required jump is possible with established movement values.
- Every enemy has a visible tell, safe response, and recovery window.

### Layout

- All 15 cogs and five fragments are reachable and count exactly once.
- Eight checkpoints restore the complete encounter state.
- No mandatory path takes longer than 45 seconds to replay after failure.
- Optional routes never conceal the main exit or trap the player.

### Difficulty

- At least 80% of fresh testers complete Civic Intake without verbal help.
- At least 70% identify why Pack cannot catch during deployment after the first demonstration.
- Median first-clear time is 22-30 minutes.
- Ghost Platform and First Train form a two-part difficulty peak: moving-route mastery first, then a shorter high-intensity finale after CP8.
- Every area changes elevation at least twice, and no required challenge lane remains flat for more than one screen.
- Every interactive machine visibly changes route geometry, enemy access, or Link routing; no mandatory switch merely opens an unseen door.

### Narrative

- A zero-fragment player understands that the city identifies Bix as BX-7 and that Bix chooses to investigate.
- An all-fragment player receives the complete VELA warning.
- Pack's dialogue is protective, concise, and consistent with earlier levels.
- The ending opens Level 8 without resolving the BX-7 mystery.

### Accessibility and performance

- Every critical state is communicated by at least two of colour, shape, text, sound, or motion.
- Reduced motion, longer signal windows, and stable platform assists preserve completion.
- Portrait and landscape mobile controls never require simultaneous ACT and glove input.
- Gameplay timing remains consistent at 30, 60, 120, 144, and 240 Hz.

## 17. Risks and mitigations

| Risk | Consequence | Mitigation |
|---|---|---|
| Losing Pack's catch feels like punishment | Players avoid the signature mechanic | Demonstrate the loss safely, keep recovery close, and make powered progress immediately rewarding |
| Too many returning mechanics crowd the Link | Level lacks a clear identity | Use only movement, checkpoints, two simple enemies, and the Link; avoid new combat or inventory systems |
| Relay states are visually confusing | Failures feel arbitrary | Keep one active tether, label every ACT consequence, and pair colour with icon and motion |
| Story reveal is too direct | Later mystery loses value | Confirm recognition and memory, but withhold who created BX-7 and why VELA warned him |
| Archive dialogue stalls momentum | Mid-level pacing collapses | Protect one concise scene and resume movement within 45 seconds |
| Moving tram creates frame-rate bugs | Mobile and high-refresh play diverge | Keep movement time-based, test at all target frame rates, and respawn on stable tram anchors |
| Collectibles distract from the ending | Warning lacks impact | Combine fragments before the final challenge and keep the boarding sequence dialogue-light |
| Level 7 visually resembles earlier factories | World Two feels unchanged | Use civic concrete, glass, transit signage, dawn light, and open public scale as non-negotiable identity cues |

## 18. Locked plan and final direction

### Locked defaults

- Level 7 follows the live Level 6 ending directly.
- The working title is **Clocking In**.
- The signature mechanic is **The Link**.
- The level has six areas, eight checkpoints, 15 cogs, and five VELA fragments.
- Ghost Platform is the sustained mechanical peak; First Train is a shorter equally intense synthesis followed by the emotional conclusion.
- Completion requires no collectible and no combat.
- The final destination is not revealed until Level 8.
- No code, graphics, audio, integration, or publishing work begins until this plan is approved.

### Recommended story decisions

These defaults make the plan complete and should be treated as approved direction unless deliberately changed before production:

1. Keep the title **Clocking In**. It is shorter, ties directly to the warning, and supports the workplace-comedy tone.
2. Pack admits only that he remembered the archived entry. He does not claim that he always knew Bix was BX-7.
3. Save the identity of the person who ordered VELA to stop Bix for Level 8.
4. The final train is automated by the civic system. Do not introduce an unseen survivor in Level 7.
5. Medal calculation uses the cogs collected in the current run, matching the existing result model; previously banked cogs affect progression and shield tier only.

## 19. Complete narrative script

This is a narrative and scene-direction script, not game code. HUD dialogue lines are written to fit the campaign's 70-character limit. Precision movement pauses while mandatory dialogue is playing.

### Script rules

- Bix is concise, practical, and dry. He does not narrate what the player can see.
- Pack uses precise technical language, then undercuts it with restrained humour.
- The civic system is calm, literal, and unaware that eleven years have passed.
- VELA is heard only through collected fragments and the completed warning.
- Mandatory story scenes never depend on collecting an optional fragment.
- The player may dismiss optional fragment text after its first full display.
- Repeated failures use short recovery lines and never replay major exposition.

### Scene 1: The door above the dome

**Location:** Dome Exit, 0-500  
**Trigger:** Level begins  
**Player state:** Full control after the first two lines

Scene direction: The bedding machinery settles behind Bix. The feed line clicks off section by section. Bix and Pack face a sealed service door above the nesting bay. The door opens onto pale morning light.

| Speaker | Line |
|---|---|
| SYSTEM | Feed line offline. Sector 9 routine complete. |
| PACK | Eleven years. First quiet in eleven years. |
| BIX | You said there was a door. |
| PACK | There is. I did not promise what was behind it. |
| PACK | Good news: morning. Bad news: it is eleven years late. |
| BIX | Door first. Questions after. |

Direction after dialogue: Give the player a silent 12-15 second walk before the first terminal. Mother Cluckzilla remains audible only as one distant mechanical sigh.

### Scene 2: Employee recognition

**Location:** Dome Exit, 2,050-2,500  
**Trigger:** Bix crosses the civic scanner  
**Player state:** Walking only; no hazard

| Speaker | Line |
|---|---|
| SYSTEM | Identity accepted. Employee BX-7. |
| SYSTEM | Late arrival recorded. Shift resumed. |
| BIX | That is not my name. |
| PACK | It is adjacent to your name. Bureaucratically. |
| BIX | Pack. |
| PACK | I am scanning. |
| SYSTEM | Morning route restored. Proceed to Civic Intake. |
| BIX | It was waiting for me. |
| PACK | It was waiting for BX-7. We should learn the difference. |

Checkpoint direction: CP1 activates after the last line. On replay, the terminal shows **BX-7 - SHIFT ACTIVE** without repeating the scene.

### Optional Fragment 1

**Location:** Maintenance recess near CP1  
**Display:** `SHIFT FRAGMENT 1/5 - BX-7`

| Speaker | Line |
|---|---|
| VELA | B... X... seven... |
| PACK | The carrier is damaged. Keep the fragment. |

### Scene 3: First Link deployment

**Location:** Civic Intake, 3,000-3,700  
**Trigger:** Bix approaches the first relay socket

| Speaker | Line |
|---|---|
| PACK | Civic relay socket. I can hold the link from here. |
| BIX | You stay here? |
| PACK | Temporarily. I object to the wording. |
| PACK | While linked, I cannot provide a fall catch. |
| SYSTEM | Linked units cannot provide fall assistance. |
| BIX | It has a sign for that. |
| PACK | It has had eleven years to prepare one. |

**First deploy response:**

| Speaker | Line |
|---|---|
| PACK | Link stable. The bridge is listening. |
| PACK | Stay inside the signal field until you reach recall. |

**First safe demonstration fall:**

| Speaker | Line |
|---|---|
| PACK | No catch while linked. The lower ledge is your recovery. |

**First recall:**

| Speaker | Line |
|---|---|
| PACK | Link released. Catch restored. I prefer this arrangement. |

**Turnstile Ram introduction:**

| Speaker | Line |
|---|---|
| SYSTEM | Intake barrier cycling. Stand clear. |
| PACK | Two flashes, then it crosses the painted rail. Jump it, shield, or pin the bumper. |

### Scene 4: Relay Court

**Location:** Relay Court, 7,000-12,000  
**Trigger:** First repeater becomes visible

| Speaker | Line |
|---|---|
| PACK | The next socket is beyond my direct range. |
| PACK | Move the repeater with Blue and Red. Then transfer me. |
| BIX | You make that sound ordinary. |
| PACK | It was ordinary. That is becoming the problem. |

**Street Sweeper introduction:**

| Speaker | Line |
|---|---|
| SYSTEM | Cleaning lane active. Pedestrians yield. |
| PACK | The paint marks its route. The beacon marks regret. |

**Ticket Drone introduction:**

| Speaker | Line |
|---|---|
| SYSTEM | Fare validation required. Hold position. |
| PACK | Do not hold position. It interrupts the relay. |

**Successful first transfer:**

| Speaker | Line |
|---|---|
| PACK | Transfer complete. Same link, new anchor. |
| BIX | Still you? |
| PACK | Still me. Slightly distributed. |

### Optional Fragment 2

**Location:** Upper precision route  
**Display:** `SHIFT FRAGMENT 2/5 - DO`

| Speaker | Line |
|---|---|
| VELA | Do... |
| BIX | That is not much of a message. |
| PACK | It is more than the city wanted us to hear. |

### Scene 5: Archive Spine

**Location:** Archive Spine, 12,000-17,500

**Archive entrance:**

| Speaker | Line |
|---|---|
| SYSTEM | Civic records open. Employee access confirmed. |
| BIX | It keeps calling me that. |
| PACK | Because every system agrees. |
| BIX | Systems agree with themselves. People call that evidence. |

**Blackout introduction:**

| Speaker | Line |
|---|---|
| PACK | The archive can power one section at a time. |
| PACK | Watch the edge lights before you move the link. |

**Service Clamp introduction:**

| Speaker | Line |
|---|---|
| SYSTEM | Access ladder reserved for maintenance. |
| PACK | The clamp owns the ladder until we move its carriage. Red retracts. Blue chooses where it parks. |

### Optional Fragment 3

**Location:** First vertical stack  
**Display:** `SHIFT FRAGMENT 3/5 - NOT`

| Speaker | Line |
|---|---|
| VELA | Not... |
| BIX | BX-7. Do not. |
| PACK | The sentence is becoming less welcoming. |

### Optional Fragment 4

**Location:** Blackout archive  
**Display:** `SHIFT FRAGMENT 4/5 - CLOCK`

| Speaker | Line |
|---|---|
| VELA | Clock... |
| PACK | One fragment remains. |

### Scene 6: The memory terminal

**Location:** Archive Spine, 16,600-17,500  
**Trigger:** Bix activates the mandatory terminal  
**Player state:** Locked safely on the terminal platform

Scene direction: The display shows one damaged security frame. A younger Bix enters the same district carrying a newly issued Pack unit. The image is factual, not dreamlike or stylized.

| Speaker | Line |
|---|---|
| SYSTEM | BX-7 entry log. Pack unit P-04 assigned. |
| BIX | That is me. |
| PACK | Yes. |
| BIX | You knew. |
| PACK | I remembered a record. I did not know it was you. |
| BIX | You could have told me. |
| PACK | I should have. |
| SYSTEM | Shift status: open. Eleven years overdue. |
| BIX | Then we close it. Properly. |

Direction after dialogue: Hold ambient silence for three seconds. Pack's lens closes once, then reopens. CP6 activates before control returns.

### Scene 7: Ghost Platform

**Location:** Ghost Platform, 17,500-23,000

**Station entry:**

| Speaker | Line |
|---|---|
| SYSTEM | Morning service restored. First train approaching. |
| PACK | There has not been a passenger here in eleven years. |
| BIX | There is one now. |

**Tram deployment:**

| Speaker | Line |
|---|---|
| PACK | The tram needs the link. I will meet you at the next socket. |
| BIX | You say that like it is simple. |
| PACK | It is simple. It is not easy. |

**Mid-ride relay transfer:**

| Speaker | Line |
|---|---|
| PACK | Transfer window open. Now, Bix. |
| PACK | Link caught. Tram power stable. |

**Signal Auditor introduction:**

| Speaker | Line |
|---|---|
| SYSTEM | Unauthorized relay path queued for inspection. |
| PACK | It is travelling along our tether. Ping sends it back. A branch sends it somewhere else. |

### Optional Fragment 5

**Location:** Optional hanging-sign route, 21,000-22,300  
**Display:** `SHIFT FRAGMENT 5/5 - IN`

| Speaker | Line |
|---|---|
| VELA | In. |
| BIX | BX-7, do not clock in. |
| PACK | That is a complete warning. |
| BIX | And we are heading toward the clock. |

### Scene 8: First Train

**Location:** First Train, 23,000-27,500

**Route-board fragment result:**

- With all fragments, the board assembles **BX-7, DO NOT CLOCK IN.**
- With missing fragments, collected words appear in position and blanks remain.
- The city overwrites the board after six seconds with **SHIFT RESUMED**.

**All-fragment voice playback:**

| Speaker | Line |
|---|---|
| VELA | BX-7, do not clock in. |
| SYSTEM | Unauthorized message cleared. |

**Zero-to-four-fragment version:**

| Speaker | Line |
|---|---|
| PACK | The warning is incomplete. The source is still VELA. |
| BIX | Then we find the rest on the way. |

**Final traction relay:**

| Speaker | Line |
|---|---|
| SYSTEM | Traction relay requires a linked service unit. |
| PACK | I will hold it. You reach the train. |
| BIX | And you? |
| PACK | Recall me from the door. Preferably before it closes. |

**Boarding and departure:**

| Speaker | Line |
|---|---|
| SYSTEM | Employee route restored. First train ready. |
| PACK | We can still turn back. |
| BIX | Back to what? |
| PACK | Fair. |
| BIX | We are already late. |
| SYSTEM | Departure status: on time. |

Final direction: Bix recalls Pack as the train door closes. The board changes from **11 YEARS DELAYED** to **ON TIME**. The train enters the bright civic district. Do not name the destination.

### Recovery dialogue pool

Use each line once per run. Recovery lines must not interrupt an active story scene.

| Event | Speaker | Line |
|---|---|---|
| Fall with Pack available | PACK | Caught you. I remain in favour of proximity. |
| Fall while linked | PACK | No catch from the socket. Resetting your route. |
| Signal break | PACK | Link lost. The machinery will hold before it resets. |
| Repeated signal break | BIX | Too far? |
| Repeated signal break | PACK | Too far. The flashing boundary was unusually sincere. |
| Sweeper hit | PACK | Municipal cleaning remains aggressively thorough. |
| Ticket scan | PACK | Fare rejected. Relay interrupted. Dignity unaffected. |
| Turnstile Ram hit | PACK | Access denied with unusual enthusiasm. |
| Service Clamp blocks route | PACK | Maintenance has reserved our ladder. Let us revise the reservation. |
| Signal Auditor reaches Pack | PACK | Inspection failed. Reroute first, then reconnect. |
| Tram fall | PACK | The tram continues. You do not. Trying that again. |
| Reset terminal | SYSTEM | Relay arrangement restored. Collectibles retained. |

## 20. Image prompt pack

These are text prompts for future production. They do not authorize image generation in the current task.

### Mandatory visual anchor for every prompt

Use `design/references/pack-character-v1.png` and the approved Bix/Pack concept board as strict character references. Preserve Bix's established face, hair, glasses, teal work jacket, layered utility clothing, dark cargo trousers, gloves, boots, and orange hardware accents. Preserve Pack as a compact rectangular transformable backpack robot with a large cyan camera lens, articulated utility arms, antenna, worn off-white armour, charcoal machinery, and orange service panels.

Style: semi-realistic grounded near-future industrial concept art, practical hard-surface construction, realistic metal wear, scratches, edge abrasion, grime, fasteners, seams, vents, and service access. Restrained cyan means Pack or safe technology. Amber means warning or aged civic machinery. Hazard red appears only on immediate danger. The Level 7 identity is abandoned civic modernism at early morning: pale concrete, faded mint enamel, oxidized aluminium, dirty glass, route-map yellow, long cool shadows, and clean sunlight.

Never redesign Bix or Pack. No round mascot Pack, floating orb, cute toy, chibi, cartoon, anime, fantasy, steampunk, glossy white laboratory, generic cyberpunk, purple-blue neon, heavy fog, apocalypse rubble, guns, combat armour, or unrelated costume changes.

### Gameplay asset camera rule

For gameplay assets, use a strict flat side-on orthographic view. No three-quarter angle, no isometric perspective, no visible top surface, and no foreshortening. Keep silhouettes readable at small size. Sprite sheets require true transparent RGBA backgrounds, even cell spacing, complete subjects inside every cell, no baked floor, no broad glow, no cast shadow, no labels, and no decorative border.

### Prompt 1: Level 7 landing card

**Target:** `landing-level7-v1.jpg`, 1280 x 720, 16:9

> Create a cinematic 16:9 key art image for Project Mayhem Level 7, Clocking In. Use the mandatory Bix and Pack references exactly. Bix stands on an abandoned elevated civic railway platform at early morning, facing right toward a waiting automated train. Pack is detached from his back and locked into a waist-high relay socket behind him, projecting one restrained cyan signal tether through two civic repeaters toward the train. The physical separation between Bix and Pack is the central idea. A public departure board reads only simple legible words: BX-7 and 11 YEARS DELAYED. Pale concrete, faded mint enamel, dirty glass, oxidized aluminium, route-map yellow, practical rails and ticket barriers. Long cool shadows, clean sunlight, quiet empty city, semi-realistic industrial detail, readable Bix and Pack silhouettes, no combat pose. Wide composition with Bix in the left-middle, Pack visible behind him, train on the right, bright unnamed district beyond. No logo, no UI frame, no purple neon, no destruction, no crowds.

### Prompt 2: Dome Exit backdrop

**Target:** `l7-bg-dome-exit-v1.webp`, 2112 x 896

> Create a wide side-scrolling environment backdrop, strict flat side view, for the transition from the warm Sector 9 Agri-Dome into an abandoned civic district at early morning. Left edge retains warm dusty amber-green agricultural machinery behind a sealed industrial door; the scene moves right into pale civic concrete, faded mint panels, rain-marked glass, public stairs, and cool sunrise. Show a quiet skyline and elevated transit infrastructure in the distance. No characters, enemies, text, collidable foreground platforms, visible top surfaces, or dramatic perspective. Darken background values enough for gameplay sprites to remain readable. Semi-realistic industrial materials, no cyberpunk neon, no apocalypse rubble.

### Prompt 3: Civic Intake backdrop

**Target:** `l7-bg-civic-intake-v1.webp`, 2112 x 896

> Create a wide flat side-view civic intake built eleven years ago and still automatically maintained. Clearly show three stacked elevations: basement service floor, public lobby, and upper mezzanine, connected by lift shafts, ticket-control drops, offset stairs, and bridge-counterweight housings. Repeating pale concrete bays, faded mint enamel wall panels, dirty glazed doors, route-map yellow details, restrained cyan status lights, and morning light crossing the upper floor. Quiet, orderly, empty, slightly uncanny, not ruined. Leave clean visual space for moving gameplay geometry. No characters, readable words, baked hazards, top-down view, or three-quarter camera.

### Prompt 4: Relay Court backdrop

**Target:** `l7-bg-relay-court-v1.webp`, 2112 x 896

> Create a large open municipal relay court in strict side elevation. The architecture forms a strong W-shaped traversal silhouette: west descent, rising pedestrian bridge, central inspection-booth drop, second rising bridge, and high east terrace. Include bridge pivots, manual hand-wheel stations, civic signal pylons, maintenance rails, pale concrete, oxidized aluminium, faded mint paint, route-map yellow, restrained cyan service lights, and a clean distant skyline. The background must reinforce vertical movement without drawing playable platforms into it. Empty but operational. No characters, drones, text, perspective tilt, visible platform tops, or excessive blue lighting.

### Prompt 5: Archive Spine backdrop

**Target:** `l7-bg-archive-spine-v1.webp`, 2112 x 896

> Create a tall four-storey civic records archive for a side-scrolling vertical climb, flat orthographic side view. A central counterweight shaft divides west and east climbing stacks; cross-passages loop clockwise and counter-clockwise around it. Include overhead clamp rails, service ladders, lift landings, shutter housings, narrow maintenance lights, dark glass, pale concrete ribs, faded mint cabinets, restrained cyan edge strips, and shafts of daylight from high windows. Show strong alternating climb-drop-climb structure without perspective distortion. Quiet administrative unease, no horror imagery, characters, readable documents, or top surfaces.

### Prompt 6: Ghost Platform backdrop

**Target:** `l7-bg-ghost-platform-v1.webp`, 2112 x 896

> Create an abandoned elevated tram depot still running its morning schedule, strict flat side-on gameplay view. Show three readable elevations: tram roofs and hanging signs above, public platforms in the middle, and a service tunnel below. Ladders, open carriage cuts, gantries, and maintenance stairs connect them in alternating vertical directions. Use concrete platforms, dirty glass shelters, mint enamel columns, route-map yellow bands, silent tracks, civic signal equipment, and distant apartments in clean sunrise. One automated tram silhouette may appear deep in the background. Quiet and functional, not haunted or ruined. No characters, readable text, strong perspective, visible top surfaces, neon city, fog, or clutter.

### Prompt 7: First Train backdrop

**Target:** `l7-bg-first-train-v1.webp`, 2112 x 896

> Create the final civic rail departure complex in strict flat side view. Show a service pit below the platform, two luggage lifts rising to an overhead signal gantry, the roof of a clean but aged automated train, and an emergency hatch descending into the carriage. The complete composition should read as one climb from below the tracks to above the train and back down inside it. Include practical service panels, dirty windows, route-map yellow markings, relay infrastructure, and an old departure-board housing. Beyond the track, early sunlight reveals a larger unnamed civic district. No people, readable destination, heroic fantasy lighting, cyberpunk neon, destruction, or perspective tilt.

### Prompt 8: Pack Link animation sheet

**Target:** `l7-pack-link-v1.webp`, transparent sprite sheet

> Create a transparent animation sheet of canonical Pack using the mandatory reference exactly, strict flat side elevation facing right. Show eight evenly spaced full-body frames: attached backpack idle, release latch opening, compact hop away from Bix, utility legs extending, landing beside socket, connector arm extending, connector locked with restrained cyan lens pulse, and recall launch pose. Keep worn off-white armour, charcoal mechanisms, orange service panels, cyan camera lens, articulated utility arms, and antenna unchanged. Mechanical movement must be plausible and readable. No Bix, floor, shadow, labels, glow cloud, cropped parts, perspective, or redesign.

### Prompt 9: Bix relay interaction sheet

**Target:** `l7-bix-relay-actions-v1.webp`, transparent sprite sheet

> Create a transparent sprite sheet of canonical Bix in strict flat side elevation facing right, preserving his exact face, hair, glasses, teal work jacket, utility straps, dark cargo trousers, gloves, boots, and orange hardware accents. Eight evenly spaced complete poses: neutral idle, kneel to release Pack, hand on civic terminal, look back toward deployed Pack, brace during signal transfer, shield raised, sprint toward recall, and catch Pack returning onto his back. Semi-realistic anatomy, practical movement, consistent proportions and lighting. No weapon, floor, shadow, captions, cropped limbs, perspective, or costume redesign.

### Prompt 10: Civic relay prop atlas

**Target:** `l7-relay-props-v1.webp`, transparent atlas

> Create a transparent prop atlas in strict flat front or side elevation with evenly separated assets: inactive relay socket, active relay socket, repeater carriage on rail, return terminal, reset terminal, linked gate, rotating pedestrian bridge segment, traction relay, ticket barrier, departure board housing, civic bench, route-map case, and maintenance tram service plate. Semi-realistic worn civic-industrial construction using pale concrete, faded mint enamel, oxidized aluminium, charcoal mechanics, route-map yellow, restrained cyan active lights, and amber warning lights. Provide clear inactive and active variants where needed. No characters, readable words, baked shadow, broad glow, perspective, overlapping cells, or decorative border.

### Prompt 11: Street Sweeper animation sheet

**Target:** `l7-street-sweeper-v1.webp`, transparent sprite sheet

> Create a transparent eight-frame side-view animation sheet for a low autonomous municipal Street Sweeper. It is practical public-service machinery, not a monster: compact rectangular body, worn mint and off-white panels, charcoal wheels and brushes, amber rotating beacon, route-yellow safety marks, visible maintenance seams and grime. Frames show idle, beacon warning, brush spin-up, sweep forward, full brush extension, push contact, brush retract, and turn pause. Silhouette must be readable at gameplay size. No red eyes, teeth, weapons, cute face, floor, shadow, text, perspective, cropped parts, or broad glow.

### Prompt 12: Ticket Drone animation sheet

**Target:** `l7-ticket-drone-v1.webp`, transparent sprite sheet

> Create a transparent eight-frame side-view animation sheet for an automated civic Ticket Drone. Small hovering inspection unit with worn off-white and charcoal shell, faded mint civic panel, route-yellow identifier block, restrained cyan idle scanner, and hazard red only during active relay interruption. Frames show idle hover, turn, scan cone charge, cyan sweep, amber lock warning, red interruption pulse, recoil, and return to idle. Mechanical and administrative rather than military. No guns, missiles, aggressive face, round mascot design, floor, shadow, text, perspective, cropped parts, or neon aura.

### Prompt 13: Turnstile Ram animation sheet

**Target:** `l7-turnstile-ram-v1.webp`, transparent sprite sheet

> Create a transparent eight-frame strict side-view animation sheet for an automated civic Turnstile Ram. It is a waist-high access-control carriage constrained to one floor rail, with worn off-white and faded mint panels, a charcoal magnetic bumper, route-yellow markings, and two amber warning lamps. Frames show idle, first flash, second flash, barrier lowering, rail charge, shield contact, magnetic-stop capture, and reset. Administrative machinery, not a combat vehicle. No face, weapon, floor, shadow, text, perspective, cropped parts, or broad glow.

### Prompt 14: Service Clamp animation sheet

**Target:** `l7-service-clamp-v1.webp`, transparent sprite sheet

> Create a transparent eight-frame strict side-view animation sheet for an overhead civic Service Clamp mounted on a horizontal maintenance rail. Practical articulated clamp, worn aluminium housing, faded mint access panel, charcoal joints, route-yellow warning stripe, and restrained amber status lamp. Frames show parked, rail travel, target tell, descend, lock ladder or platform, Red magnetic retract, Blue carriage pull, and harmless parked state. It manipulates infrastructure and never grabs a person. No creature styling, weapon, floor, shadow, text, perspective, cropped rail, or broad glow.

### Prompt 15: Signal Auditor animation sheet

**Target:** `l7-signal-auditor-v1.webp`, transparent sprite sheet

> Create a transparent eight-frame strict side-view animation sheet for a small municipal Signal Auditor that attaches only to a cyan relay tether. Use a compact clamp-on inspection body with worn off-white shell, charcoal rollers, faded mint civic plate, amber inspection lamp, and hazard red only at interruption. Frames show tether attachment, scan, travel left, pause tell, Pack ping reversal, branch diversion, red interruption, and detach. Mechanical inspection device, not a mascot or combat drone. No face, weapon, floor, shadow, text, perspective, cropped parts, or neon aura.

### Prompt 16: Link effects sheet

**Target:** `l7-link-effects-v1.webp`, transparent effects sheet

> Create a transparent 2D effects sheet for the Link system in strict side-view game presentation. Include a restrained cyan tether pulse in six phases, linked-chain icon activation, repeater hand-off ring, signal-radius boundary markers, amber 80-percent range warning, broken-chain interruption, one-second machinery hold state, recall trail, and reduced-motion steady alternatives. Crisp technical energy, thin controlled light, no magical particles, lightning storm, smoke, lens flare, broad bloom, background, text, or purple-blue neon.

### Prompt 17: Archive memory frame

**Target:** `l7-archive-memory-v1.webp`, 1280 x 720

> Create a damaged civic security-camera still in 16:9. A younger canonical Bix enters the abandoned civic district eleven years earlier with a newly issued canonical Pack attached to his back. Preserve both designs and proportions exactly, but make their equipment cleaner and less worn. Flat high-mounted security-camera composition with mild lens distortion, desaturated public-building lighting, pale concrete intake gate, simple timestamp blocks with no readable date, and subtle compression damage. The image must look factual and administrative, not dreamlike. No horror face, ghosting, combat, extra people, dramatic spotlight, redesign, or readable exposition.

### Prompt 18: Departure story frame

**Target:** `l7-departure-v1.webp`, 1280 x 720

> Create a cinematic 16:9 final story frame using canonical Bix and Pack exactly. Inside an aged automated civic train at sunrise, Bix stands near the closing door after recalling Pack onto his back. Pack's cyan lens is visible over Bix's shoulder. Through the window, the empty platform departure board changes from a delayed state to a simple on-time state, while the train enters a bright unnamed district. Bix looks determined rather than triumphant. Semi-realistic grounded industrial materials, quiet civic unease, clean morning light, pale concrete and faded mint outside, restrained cyan and route-yellow accents. No combat, cheering crowd, destination name, purple neon, fantasy skyline, or redesign.

### Prompt review checklist

Before any future image is accepted:

- Bix and Pack match their canonical references without redesign.
- Gameplay assets use flat side-on orthographic presentation.
- Sprite sheets have true transparency and complete, separated cells.
- Safe technology is restrained cyan; warning is amber; red means danger.
- Materials are semi-realistic, worn, practical, and mechanically plausible.
- Level 7 reads as civic infrastructure at morning, not another factory.
- No text is baked into gameplay assets unless the prompt explicitly requires it.
- Backgrounds preserve contrast and empty space for gameplay readability.
- The asset has no unrequested weapons, characters, shadows, or glow.
- Filename is versioned and the authored master is preserved under `design/`.
