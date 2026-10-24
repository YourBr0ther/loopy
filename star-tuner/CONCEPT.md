# Star Tuner — Concept Expansion

**Status:** concept / brainstorm. Nothing here is built.
**One-liner:** A read-only "flight surgeon" for your PC that explains, in plain language, what is holding Star Citizen back on *your* machine and why.

## Ground rules (from the original idea)

1. **No touch.** Star Tuner never changes a setting, kills a process, edits a file, or writes to the registry. It observes, explains, and points. The user does the doing.
2. **No AI in the tool.** Every finding is a canned rule: *we noticed X → this usually means Y for Star Citizen → here is what people typically do about it.* Rules are hand-written, versioned, and maintained as patches change the game.
3. **Runs while playing and while not playing.** Two very different jobs, covered in "Modes" below.
4. **Star Citizen specific.** General PC-tuning tools exist. The value is that every rule is framed around what *this* game does: CPU-heavy simulation, enormous RAM/VRAM appetite, constant streaming from disk, and a server tick rate the client can't fix.

---

## Why Star Citizen is a special case

A short "why this matters" that shapes every rule. These are the assumptions the canned text leans on:

- **CPU-bound more often than GPU-bound.** Entity simulation, physics, AI, and network replication sit on the CPU. A fast GPU paired with a slow or badly-scheduled CPU is the single most common disappointment.
- **Single-thread sensitivity still matters** even with the multi-threaded Gen12/Vulkan renderer. Clock speed, cache size (AMD X3D parts), and memory latency show up directly in frame times, especially in cities.
- **RAM hungry.** 32 GB is the practical floor for a smooth session, 64 GB is noticeably better in populated areas, and the game leans on the pagefile hard. Memory footprint grows over a long session.
- **VRAM hungry.** 4K textures and large planetary tech blow past 8 GB quickly. When dedicated VRAM runs out, the driver spills into system RAM over PCIe and the result is stutter, not a clean FPS drop.
- **Disk streaming never stops.** Planet surfaces, cities, and ship interiors stream constantly. HDDs are unusable; SATA SSDs stutter in cities; NVMe is the real recommendation. Free space and shader cache state matter.
- **Server performance is a real, separate bottleneck.** A 60 FPS client on a 5 FPS server still feels terrible. Users waste hours tuning a client problem that doesn't exist. Star Tuner should help people *tell the difference*.
- **Shader compilation after every patch.** The first few sessions after a patch stutter for reasons that have nothing to do with hardware. Knowing a patch just landed changes the advice.

---

## Modes

### 1. Pre-flight check (game not running)
A static audit of hardware, drivers, OS configuration, and installed software. Fast, deterministic, repeatable. Produces a scorecard and a list of findings. This is where most of the "canned" value lives.

### 2. Live session (game running)
Low-overhead sampling while playing: frame times, CPU/GPU utilization per core, VRAM and system memory, pagefile activity, disk queue, network latency/loss, temperatures, clocks, and which *other* processes are consuming cycles. Builds a timeline so stutters can be correlated with causes ("every spike lines up with Chrome waking up" or "VRAM hit the ceiling at 14:32 and shared memory jumped").

### 3. Post-session debrief (game just closed)
Reads the session timeline plus Star Citizen's own `Game.log` and summarizes: where time went, worst stutter moments and the most likely cause for each, whether the session was client-bound or server-bound, whether memory grew over time, and whether the game crashed and what the signature looked like.

### 4. Change tracking (between runs)
Every run is saved. The tool diffs runs so a user can see "you updated your GPU driver and your 1% lows got worse" or "after enabling XMP your average frame time dropped 18%." Still no-touch: the user made the change, Star Tuner just confirms whether it helped.

---

## Areas to examine (the expanded list)

Each area below is a family of rules. Every rule should have: **Observation**, **Why it matters for Star Citizen**, **What you can look at / typically do**, **Confidence**, and **Evidence** (the raw numbers that triggered it).

### A. CPU

- **Model and generation vs. CIG's published minimum/recommended spec.** Plain tiering: "below minimum", "meets minimum", "recommended", "comfortable".
- **Hybrid cores (Intel 12th gen and newer).** Is the game landing on P-cores? Are E-cores grabbing game threads? Is Windows Game Mode on (it influences Thread Director)? Is the chipset/Thread Director driver installed?
- **Dual-CCD AMD X3D parts (7900X3D / 7950X3D / 9950X3D).** Is the game being scheduled onto the V-cache CCD? Is the AMD chipset driver installed and is the "3D V-Cache Performance Optimizer" service present? Is Game Mode enabled (the driver depends on it)?
- **Sustained clocks vs. advertised boost.** Sampled under load. Low sustained clocks point to thermals, power limits, or a power plan problem.
- **Thermal throttling.** Package temperature near Tjmax, clock dips that correlate with temperature. Explain what this looks like in-game (good FPS for 10 minutes, then it falls off a cliff).
- **Power plan.** Balanced vs High Performance vs Ultimate, processor minimum state, core parking behavior. Laptop on battery is its own finding.
- **SMT / Hyper-Threading disabled.** Some users turn it off for other games. For Star Citizen that's usually a net loss.
- **Core count and what else is pinned to those cores.** Streaming software, browser, RGB software, and anti-cheat all compete.
- **Microcode / BIOS currency.** Call out known-bad eras (e.g., Intel 13th/14th gen instability microcode, early AGESA for new AMD platforms) as "a BIOS update exists for a known issue affecting this CPU family", without telling anyone to flash anything.
- **Virtualization-based security (VBS / HVCI / Memory Integrity) and Hyper-V.** Measurable CPU cost in CPU-bound games. Report it as a *trade-off*, not a recommendation to disable: "This is a security feature. It costs roughly X% in CPU-bound titles. Your call."
- **Spectre/Meltdown-style mitigations on older CPUs.** Same framing as above.

### B. Memory (RAM)

- **Capacity.** Under 16 GB: expect crashes. 16 GB: expect stutter and heavy pagefile use. 32 GB: fine. 64 GB: headroom for long sessions and populated areas.
- **Channel configuration.** Single-channel is a silent, massive penalty. Detect one stick, or two sticks in the wrong slots.
- **Actual running speed vs. rated speed (XMP / EXPO not enabled).** Extremely common: DDR5-6000 kit running at 4800. Star Citizen is memory-latency sensitive, so this is a top-five finding.
- **Memory timings / latency.** Report, don't tune.
- **Mixed kits / mismatched modules.** Stability and speed risk.
- **Pagefile configuration.** Disabled, too small, fixed vs system-managed, on an HDD, on a nearly full drive. Star Citizen commits far beyond physical RAM; a disabled or tiny pagefile is a known crash cause.
- **Commit charge vs. physical RAM during a session.** Shows how hard the game is leaning on the pagefile.
- **Memory growth over the session.** Flag "the game's working set grew from 18 GB to 31 GB over 2 hours; a restart between long sessions may help", without calling it a leak.
- **Other resident memory hogs.** Browser tabs, Discord, Electron apps, Wallpaper Engine. Report the top consumers alongside the game.
- **Windows memory compression and standby list pressure.** Explain when they're the cause of hitching.

### C. GPU

- **Model and VRAM vs. target resolution and texture quality.** Tiering by resolution: 1080p / 1440p / 4K / ultrawide.
- **Dedicated VRAM usage vs. capacity, and shared GPU memory usage.** The key stutter detector. Shared memory climbing means VRAM has spilled over PCIe. Explain the symptom (hitching, texture pop-in) and the levers (texture quality, resolution scaling, upscaler, closing other GPU-using apps).
- **Other processes using the GPU and VRAM.** Browsers with hardware acceleration, Discord, Wallpaper Engine, second-monitor video, OBS preview, RGB software with 3D previews.
- **Driver version and age.** Flag very old drivers and, where known, drivers with Star Citizen-specific regressions. Note whether a clean install was done recently if detectable.
- **PCIe link width and generation under load.** A card negotiating x8 Gen3 when it should be x16 Gen4 (wrong slot, riser cable, M.2 lane sharing) is a real and invisible loss, and it compounds the VRAM-spill problem.
- **Resizable BAR / Smart Access Memory.** Report state. Modest gains in some titles; explain it's a BIOS setting.
- **Hardware-Accelerated GPU Scheduling (HAGS).** Report state and explain it's mixed for this game.
- **Power limit and thermals (core, hot spot, VRAM temperature).** Clocks dropping under sustained load.
- **Multi-Plane Overlay (MPO) and fullscreen optimizations.** Known causes of flicker and stutter on some driver/monitor combos.
- **Renderer in use (DirectX 11 vs. Vulkan) and upscaler state (DLSS / FSR / none).** Read from the game's settings, not changed. Explain the trade-offs in plain terms.
- **Laptop: which GPU is the game actually running on?** Integrated vs discrete selection, MUX switch, Advanced Optimus. A shocking number of laptop "performance problems" are the game running on the iGPU.
- **Overclocking / undervolting software present** (Afterburner, Adrenalin tuning profiles). Report, and where crashes correlate, mention it as a stability suspect.

### D. Storage

- **Drive type where the game is installed.** HDD / SATA SSD / NVMe / external USB. HDD is a hard "this will not be a good experience."
- **Free space on the game drive.** Under 10–15% free on an SSD hurts write performance and shader cache rebuilds.
- **Drive health (SMART).** Reallocated sectors, wear level, temperature throttling on NVMe.
- **Is the pagefile on the same drive as the game, and is that drive slow or full?**
- **Shader cache state.** Location, size, age relative to the last patch. After a patch, the canned explanation is "this is expected shader compilation stutter for the first few sessions"; a stale or corrupt cache suggests the well-known community step of clearing it (user does it).
- **Antivirus real-time scanning of the game folder.** Defender and third-party AV scanning thousands of streamed files is a classic stutter source. Report whether the install path is excluded.
- **Windows Search indexing the game folder.**
- **Cloud sync clients (OneDrive, Dropbox, Google Drive) touching the game folder, the USER folder, or the screenshots folder.**
- **BitLocker / full-disk encryption on the game drive.** Small but real cost on some systems.
- **Drive sharing lanes with the GPU** (M.2 slot that drops the GPU to x8). Pairs with the PCIe finding above.

### E. Operating system and Windows configuration

- **Windows version and build.** Flag unsupported/old builds and builds with known scheduler problems for hybrid CPUs.
- **Game Mode.** Report state; important for hybrid Intel and X3D AMD.
- **Xbox Game Bar and Game DVR / background recording.** Background capture costs frames.
- **Overlays detected:** Discord, Steam, NVIDIA App / GeForce Experience, AMD Adrenalin overlay, Medal, Overwolf, RTSS, Afterburner OSD. Multiple overlays stacked is a frequent stutter and crash cause.
- **Pending Windows updates / reboot required.** Background update work during play.
- **Scheduled tasks and background maintenance running during the session** (Defender scheduled scan, Windows Update, OneDrive, driver updaters).
- **Display scaling, HDR state, multi-monitor refresh-rate mismatches, and which monitor is primary.**
- **USB selective suspend and PCIe Link State Power Management** (relevant to input devices and GPU latency).
- **Visual C++ runtimes and DirectX components** present (crash-on-launch class of problems).
- **Easy Anti-Cheat service health.** Launch failures and "kicked" problems.
- **Windows Defender exclusions and tamper state** — report only.

### F. Background processes and software conflicts

The "what else is eating cycles" view. Report the top CPU, RAM, GPU, disk, and network consumers *other than the game*, and attach canned notes for recognized offenders:

- **Browsers** with dozens of tabs and hardware acceleration (CPU, RAM, and VRAM).
- **RGB and peripheral suites:** Corsair iCUE, Razer Synapse, Logitech G Hub, ASUS Armoury Crate, MSI Center, NZXT CAM. Frequently high CPU, known for stutter.
- **Monitoring tools** polling sensors at high frequency (HWiNFO at 100 ms, Afterburner, NZXT CAM). Ironic but real.
- **Streaming / recording:** OBS, ShadowPlay Instant Replay, Medal. Expected cost, but worth quantifying.
- **Wallpaper Engine / Lively** and animated wallpapers.
- **Voice and chat:** Discord (hardware acceleration), Teams, Slack pre-launched.
- **Sim peripherals:** HOTAS vendor software, Joystick Gremlin, vJoy, TrackIR, Tobii, VoiceAttack, Stream Deck. Mostly fine, but some poll aggressively.
- **High-polling-rate mice (4 kHz / 8 kHz).** Measurable CPU cost in CPU-bound games.
- **Virtualization and dev tooling:** Hyper-V, WSL2, Docker Desktop, VMware, VirtualBox running in the background.
- **Crypto miners, torrent clients, backup software, cloud sync** doing heavy I/O or network.
- **Multiple anti-virus / anti-cheat products** installed at once.
- **Second instance of the game or RSI Launcher stuck in the background.**

### G. Network

Framed carefully, because most "lag" in Star Citizen is server-side.

- **Wired vs. Wi-Fi**, Wi-Fi band and signal quality.
- **Latency, jitter, and packet loss to the game's regions** sampled over the session.
- **Bufferbloat** (latency under load) — very common on consumer routers and causes rubber-banding when someone else in the house streams video.
- **VPN or proxy active.**
- **Other bandwidth consumers during the session** (updates, cloud sync, streaming on another device is out of scope but the local ones aren't).
- **Server FPS vs. client FPS.** Star Citizen exposes server tick rate in-game. The debrief should say plainly: "Your client averaged 71 FPS. The server you were on averaged 8 FPS. Your hardware was not the problem in this session."

### H. Thermals, power, and physical

- **CPU and GPU temperatures over time**, with throttling events marked on the timeline.
- **Fan behavior** where readable (fans not ramping = airflow or curve problem).
- **PSU-adjacent symptoms:** GPU power excursions correlating with crashes/black screens (report as a suspect, not a diagnosis).
- **Laptop specifics:** battery vs. plugged in, OEM performance mode, thermal limits, iGPU vs dGPU.
- **Case/airflow inference:** when GPU hot spot and CPU temps climb together over 20+ minutes, say so in words.

### I. Display and output

- **Resolution vs. GPU tier** (the "you're asking a 3060 to do 4K ultra" conversation).
- **Refresh rate actually in use vs. the panel's maximum** (set to 60 Hz on a 144 Hz monitor is common).
- **VRR (G-Sync / FreeSync) state, V-Sync state, frame caps.** Explain the stutter and input-latency implications.
- **HDR on/off**, Windows auto-HDR.
- **Multiple monitors**, particularly a second monitor playing video (GPU and VRAM cost).
- **Display cable limitations** (an HDMI cable capping refresh) where inferable.

### J. Star Citizen's own files and settings (read-only)

- **Which build/environment is installed** (LIVE, PTU, EPTU, TECH-PREVIEW) and how recently it was patched. Patch recency changes the shader-stutter advice.
- **`Game.log` parsing:** session length, load times, shader compile warnings, memory warnings, crash signatures and the canned explanation for the most common ones (GPU device hung/TDR, out-of-memory, anti-cheat, network disconnects).
- **User settings read from the profile** (resolution, scaling, upscaler, clouds/volumetrics, SSDO, motion blur, chromatic aberration, FOV). Report which settings are known heavy hitters on this hardware tier. Never edit.
- **USER folder size and age**, shader folder size and date vs. patch date.
- **Launcher state:** stuck updates, multiple installs, install on a slow drive.
- **Windows Event Log cross-reference** for crash sessions: WHEA errors (hardware), LiveKernelEvent 141 (GPU), application-error entries for the game executable.

### K. Stability and crash forensics (a natural extension)

Not just performance. People uninstall over crashes.

- Correlate crash timestamps with: VRAM ceiling, pagefile exhaustion, GPU clock/power excursions, CPU temperature, XMP/overclock presence, driver version.
- Canned "crash profiles": *"This pattern (device hung + undervolt software present + high GPU power draw) is commonly associated with unstable GPU tuning. Consider testing at stock settings."*
- Memory-instability profile: *"Random crashes across many sessions with XMP enabled on a 4-stick DDR5 configuration are a known stability pattern."*

---

## How findings are presented

**Scorecard first.** Six dials: CPU, Memory, GPU/VRAM, Storage, OS & Background, Network. Each gets Good / Watch / Problem, plus a one-sentence headline.

**Then findings, ranked by impact.** Each finding uses the same card:

> **We noticed:** Your DDR5-6000 memory is running at 4800 MT/s.
> **Why it matters for Star Citizen:** The game is sensitive to memory speed and latency. This setting is commonly worth a noticeable frame-time improvement in cities.
> **What people usually do:** Enable the XMP/EXPO profile in BIOS. This is a BIOS setting; Star Tuner does not change it.
> **Confidence:** High (read directly from SPD and current clock).
> **Evidence:** Rated 6000 MT/s · Running 4800 MT/s · 2 × 16 GB · Dual channel.

Severity tiers: **Blocking** (HDD, below minimum spec, pagefile disabled), **Major** (single-channel RAM, VRAM spill, XMP off, iGPU in use), **Moderate** (overlays, AV scanning the folder, old driver), **Informational** (VBS trade-off, HAGS state).

**"Not your machine" is a first-class finding.** When the session is server-bound, say so prominently. It's the most useful thing the tool can say to a frustrated player.

**Shareable report.** Export a plain-text or markdown summary a user can paste into Spectrum, Discord, or Reddit when asking for help. Half of community troubleshooting is people asking "what are your specs?" and the answer being incomplete.

---

## What the tool explicitly does not do

- Change settings, kill processes, edit the registry, touch BIOS, or modify any Star Citizen file.
- Inject into or hook the game process (anti-cheat safety; all telemetry comes from the OS, drivers, and public performance counters).
- Phone home. Everything stays local unless the user exports a report.
- Prescribe risky changes (overclocking, disabling security features) as recommendations. Trade-offs are explained; the choice is the user's.
- Use AI or any dynamic text generation. Rules in, canned explanations out.

---

## Keeping the canned content honest

- **Rules are versioned alongside Star Citizen patch versions.** A rule can carry "last verified against 4.x" so stale advice is visible.
- **Every rule carries a confidence level** tied to how directly it was measured versus inferred.
- **Community-sourced sweet spots** (e.g., "32 GB is the real floor") should be labeled as community consensus, distinct from CIG's official spec.
- **Avoid absolute promises.** "Commonly improves," "frequently associated with," never "will fix."

---

## Open questions to think about later

- How to detect the game's *perceived* stutter without hooking it (OS-level present timing is the likely answer).
- How much live-session overhead is acceptable, and how to prove the tool itself isn't the problem (it should report its own cost).
- Whether to tier recommendations by what the user says they care about (max FPS vs. stable frame times vs. visual quality).
- Whether a "community baseline" (anonymous, opt-in, aggregated) would be worth the privacy trade-off to tell people "machines like yours typically see X." Probably a later question.
- Linux/Proton players exist and are a vocal minority; worth deciding early whether they're in scope.
