# Third-party Claude Code skills (installed 2026-11-12 at the owner's request)

| Skills | Source | Commit date | License |
|---|---|---|---|
| threejs-animation, threejs-asset-pipeline, threejs-fundamentals, threejs-geometry, threejs-interaction, threejs-lighting, threejs-loaders, threejs-materials, threejs-performance, threejs-postprocessing, threejs-react-three-fiber, threejs-shaders, threejs-textures | https://github.com/CloudAI-X/threejs-skills | 2026-10-19 | MIT |
| design-dna | https://github.com/zanwei/design-dna | 2026-08-28 | MIT |
| motion-design | https://github.com/LottieFiles/motion-design-skill | 2026-05-18 | MIT |
| cast, paint, bunshin, _jutsu/* (genjutsu v4.1.3) | https://github.com/AThevon/genjutsu | 2026-11-06 | MIT |

Reviewed before install: no network exfiltration, remote-script execution or prompt-override instructions found.
Notes: `bunshin` orchestrates many subagents (millions of tokens, hours) and runs only when asked for by name.
Project rules in `portfolio-3d-upgrade` (identity protection, no invented content, CMS-first) take precedence over any third-party skill.

## Added 2026-11-12 (second batch)
| Skills | Source | Commit date | License |
|---|---|---|---|
| agents, dubbing, music, onboarding, realtime, setup-api-key, sound-effects, speech-engine, speech-to-text, text-to-speech, voice-changer, voice-isolator | https://github.com/elevenlabs/skills (official) | 2026-11-10 | MIT |
| aframe-webxr, animated-component-libraries, animejs, babylonjs-engine, barba-js, blender-web-pipeline, gsap-scrolltrigger, lightweight-3d-effects, locomotive-scroll, lottie-animations, modern-web-design, motion-framer, pixijs-2d, playcanvas-engine, react-spring-physics, react-three-fiber, rive-interactive, scroll-reveal-libraries, spline-interactive, substance-3d-texturing, threejs-webgl, web3d-integration-patterns | https://github.com/freshtechbro/claudedesignskills | 2025-11-19 | MIT |

Notes: ElevenLabs skills need an ElevenLabs account + `ELEVENLABS_API_KEY` (paid API) and reference the vendor's CLI installer; nothing is run without the owner's approval. `skill-creator` from claudedesignskills was not installed (duplicates the built-in skill). CloudAI-X/threejs-skills was already installed in the first batch.
