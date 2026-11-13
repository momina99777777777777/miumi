import { useEffect, useRef, useState } from "react";
import "./in-between.css";

type GameMessage = { title: string; body: string };
type ThreeModule = any;

const SAVE_KEY = "miumi-in-between-save-v1";

export default function InBetweenGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<{ dispose: () => void } | null>(null);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState<GameMessage | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [clockSolved, setClockSolved] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engineError, setEngineError] = useState("");
  const [nearbyPrompt, setNearbyPrompt] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { inventory?: string[]; clockSolved?: boolean; doorOpen?: boolean };
        setInventory(Array.isArray(data.inventory) ? data.inventory : []);
        setClockSolved(Boolean(data.clockSolved));
        setDoorOpen(Boolean(data.doorOpen));
      }
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ inventory, clockSolved, doorOpen }));
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  }, [inventory, clockSolved, doorOpen]);

  useEffect(() => {
    if (!started || !canvasRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      setLoading(true);
      setEngineError("");
      try {
        // Three.js is loaded only when the player enters the game, keeping Miumi's
        // regular pages light. The browser fetches the pinned ESM build at runtime.
        const threeModuleUrl = "https://esm.sh/three@0.180.0";
        const loaderModuleUrl = "https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";
        const THREE = await import(/* @vite-ignore */ threeModuleUrl) as ThreeModule;
        const { GLTFLoader } = await import(/* @vite-ignore */ loaderModuleUrl) as { GLTFLoader: new () => { load: (url: string, onLoad: (gltf: any) => void, onProgress?: undefined, onError?: (error: unknown) => void) => void } };
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#10131a");
        scene.fog = new THREE.FogExp2("#11141b", 0.035);
        const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        scene.add(new THREE.HemisphereLight("#a9b9d1", "#29201b", 1.35));
        const moon = new THREE.DirectionalLight("#9bb6dc", 1.5);
        moon.position.set(-5, 9, 5);
        moon.castShadow = true;
        moon.shadow.mapSize.set(1024, 1024);
        scene.add(moon);
        const warm = new THREE.PointLight("#e6a86c", 13, 17, 2);
        warm.position.set(0, 3.4, -5);
        scene.add(warm);

        const mat = (color: string, roughness = 0.82, metalness = 0) =>
          new THREE.MeshStandardMaterial({ color, roughness, metalness });
        const floorMat = mat("#34343a");
        const wallMat = mat("#4a4542");
        const darkWood = mat("#211a18");
        const wood = mat("#51382b");
        const brass = mat("#9b7444", 0.35, 0.7);
        const paper = mat("#d7c8a7");
        const makeBox = (w: number, h: number, d: number, material: ThreeModule["MeshStandardMaterial"], x: number, y: number, z: number) => {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          return mesh;
        };

        makeBox(16, 0.35, 18, floorMat, 0, -0.2, -2);
        makeBox(16, 6, 0.35, wallMat, 0, 2.8, -11);
        makeBox(0.35, 6, 18, wallMat, -8, 2.8, -2);
        makeBox(0.35, 6, 18, wallMat, 8, 2.8, -2);
        makeBox(16, 0.35, 18, darkWood, 0, 5.8, -2);
        // A dark opening and heavy door at the far end.
        const door = makeBox(2.4, 4.1, 0.22, darkWood, 0, 2.05, -10.72);
        makeBox(2.55, 0.16, 0.3, brass, 0, 4.2, -10.58);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), brass);
        knob.position.set(0.82, 1.8, -10.48);
        scene.add(knob);

        // Tall library shelves, filled with individually shaded book spines.
        for (const side of [-1, 1]) {
          for (let bay = 0; bay < 3; bay++) {
            const x = side * 6.95;
            const z = -7 + bay * 4.8;
            makeBox(0.9, 4.8, 3.9, darkWood, x, 2.35, z);
            for (let shelf = 0; shelf < 4; shelf++) {
              const y = 0.75 + shelf * 1.08;
              makeBox(0.96, 0.09, 3.82, wood, x, y, z);
              for (let b = 0; b < 12; b++) {
                const colors = ["#784b3c", "#9a7650", "#344b50", "#70604c", "#473b58", "#8a8067"];
                const book = makeBox(0.12 + (b % 3) * 0.025, 0.58 + ((b * 7) % 4) * 0.07, 0.22, mat(colors[(b + shelf + bay) % colors.length]), x + (side < 0 ? 0.05 : -0.05), y + 0.34, z - 1.65 + b * 0.29);
                book.rotation.z = ((b % 3) - 1) * 0.035;
              }
            }
          }
        }

        // Central reading table and scattered objects.
        makeBox(3.2, 0.18, 1.8, wood, 0, 1.15, -2.2);
        for (const x of [-1.35, 1.35]) for (const z of [-2.85, -1.55]) makeBox(0.16, 1.1, 0.16, darkWood, x, 0.55, z);
        makeBox(0.9, 0.07, 0.65, paper, -0.55, 1.28, -2.1);
        const letter = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.035, 0.48), paper);
        letter.position.set(-0.55, 1.34, -2.1);
        letter.rotation.y = -0.2;
        scene.add(letter);
        // Clock on the rear wall.
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 48), brass);
        clock.rotation.x = Math.PI / 2;
        clock.position.set(2.8, 3.8, -10.72);
        scene.add(clock);
        const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.47, 48), mat("#d9cfb8"));
        clockFace.position.set(2.8, 3.8, -10.64);
        scene.add(clockFace);
        const hand = makeBox(0.035, 0.42, 0.035, darkWood, 2.8, 3.82, -10.57);
        hand.rotation.z = -0.55;
        const painting = makeBox(1.55, 1.25, 0.12, brass, -3.9, 3.35, -10.72);
        makeBox(1.35, 1.05, 0.05, mat("#172b2a"), -3.9, 3.35, -10.62);
        // Pillars and a warm hanging light give the room depth.
        for (const x of [-4.7, 4.7]) makeBox(0.42, 5.5, 0.42, mat("#393434"), x, 2.65, -8.9);
        const lamp = new THREE.PointLight("#f2bd7b", 24, 9, 2);
        lamp.position.set(0, 4.8, -1.5);
        scene.add(lamp);
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.55, 24, 1, true), brass);
        lampShade.position.set(0, 4.7, -1.5);
        scene.add(lampShade);

        // Player: load a rigged human GLB; keep a simple fallback if the asset is offline.
        const player = new THREE.Group();
        scene.add(player);
        player.position.set(0, 0, 4.8);
        let mixer: any = null;
        const loader = new GLTFLoader();
        loader.load(
          "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb",
          (gltf: any) => {
            if (cancelled) return;
            const model = gltf.scene;
            const bounds = new THREE.Box3().setFromObject(model);
            const modelHeight = Math.max(bounds.max.y - bounds.min.y, 0.01);
            const fitScale = 1.82 / modelHeight;
            model.scale.setScalar(fitScale);
            model.position.y = -bounds.min.y * fitScale;
            model.traverse((child: any) => {
              if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
            });
            player.add(model);
            if (gltf.animations?.length) {
              mixer = new THREE.AnimationMixer(model);
              mixer.clipAction(gltf.animations[0]).play();
            }
          },
          undefined,
          () => {
            if (player.children.length) return;
            // Detailed fallback traveler with a long coat, hair and articulated limbs.
            const skin = mat("#c99a7a", 0.72);
            const coat = mat("#252b35", 0.88);
            const coatTrim = mat("#75634e", 0.75);
            const trousers = mat("#20232a", 0.9);
            const boots = mat("#171719", 0.72);
            const hair = mat("#241d1a", 0.92);
            const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.66, 6, 12), coat);
            torso.position.y = 1.12; torso.castShadow = true; player.add(torso);
            const coatTail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.48, 0.19), coat);
            coatTail.position.set(0, 0.73, 0.02); coatTail.castShadow = true; player.add(coatTail);
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 8, 20), coatTrim);
            collar.rotation.x = Math.PI / 2; collar.position.y = 1.48; player.add(collar);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 24, 18), skin);
            head.position.y = 1.78; head.castShadow = true; player.add(head);
            const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.242, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hair);
            hairCap.position.y = 1.84; player.add(hairCap);
            const limb = (x: number, y: number, length: number, material: any) => {
              const pivot = new THREE.Group(); pivot.position.set(x, y, 0); player.add(pivot);
              const part = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, length, 5, 10), material);
              part.position.y = -length * 0.42; part.castShadow = true; pivot.add(part);
              return pivot;
            };
            const armL = limb(-0.36, 1.38, 0.48, coat); const armR = limb(0.36, 1.38, 0.48, coat);
            const legL = limb(-0.16, 0.68, 0.58, trousers); const legR = limb(0.16, 0.68, 0.58, trousers);
            for (const leg of [legL, legR]) {
              const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.34), boots);
              boot.position.set(0, -0.49, -0.07); boot.castShadow = true; leg.add(boot);
            }
            player.userData.limbs = [armL, armR, legL, legR];
            player.userData.fallback = true;
          }
        );

        const keys = new Set<string>();
        let unlocked = false;
        let clockActivated = false;
        let lastPrompt = "";
        const onUnlock = () => { unlocked = true; };
        const onClockSolved = () => { clockActivated = true; };
        window.addEventListener("inbetween:unlock", onUnlock);
        window.addEventListener("inbetween:clock-solved", onClockSolved);
        const onKeyDown = (event: KeyboardEvent) => {
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
          keys.add(event.key.toLowerCase());
          if (event.key.toLowerCase() === "e") interact();
        };
        const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        let active = true;
        let frame = 0;
        const clockTimer = new THREE.Clock();
        const target = new THREE.Vector3();
        const resize = () => {
          const width = canvas.clientWidth || 1;
          const height = canvas.clientHeight || 1;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();

        function interact() {
          const px = player.position.x;
          const pz = player.position.z;
          const near = (x: number, z: number, radius = 2.1) => Math.hypot(px - x, pz - z) < radius;
          if (near(-0.55, -2.1)) {
            window.dispatchEvent(new CustomEvent("inbetween:letter"));
          } else if (near(2.8, -9.8, 2.4)) {
            window.dispatchEvent(new CustomEvent("inbetween:clock"));
          } else if (near(-3.9, -9.2, 2.2)) {
            window.dispatchEvent(new CustomEvent("inbetween:painting"));
          } else if (near(0, -9.2, 2.2)) {
            window.dispatchEvent(new CustomEvent("inbetween:door"));
          }
        }

        const animate = () => {
          if (!active) return;
          frame = requestAnimationFrame(animate);
          const delta = Math.min(clockTimer.getDelta(), 0.04);
          const forward = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
          const sideways = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
          const moving = forward !== 0 || sideways !== 0;
          if (moving) {
            const direction = new THREE.Vector3(sideways, 0, -forward).normalize();
            const step = delta * 3.2;
            const blockers = [
              { x: 0, z: -2.2, hx: 1.82, hz: 1.12 },
              { x: -4.7, z: -8.9, hx: 0.48, hz: 0.48 },
              { x: 4.7, z: -8.9, hx: 0.48, hz: 0.48 },
              { x: -3.9, z: -10.1, hx: 0.72, hz: 0.35 },
            ];
            const collides = (x: number, z: number) => blockers.some((b) => Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz);
            const nextX = THREE.MathUtils.clamp(player.position.x + direction.x * step, -5.8, 5.8);
            const nextZ = THREE.MathUtils.clamp(player.position.z + direction.z * step, -9.5, 7.2);
            if (!collides(nextX, player.position.z)) player.position.x = nextX;
            if (!collides(player.position.x, nextZ)) player.position.z = nextZ;
            player.rotation.y = Math.atan2(direction.x, direction.z);
          }
          if (player.userData.fallback && player.userData.limbs) {
            const swing = moving ? Math.sin(clockTimer.elapsedTime * 9) * 0.48 : Math.sin(clockTimer.elapsedTime * 1.7) * 0.025;
            const [armL, armR, legL, legR] = player.userData.limbs;
            armL.rotation.x = swing; armR.rotation.x = -swing;
            legL.rotation.x = -swing; legR.rotation.x = swing;
          }
          if (mixer) mixer.update(delta);
          const promptNear = (x: number, z: number, radius: number) => Math.hypot(player.position.x - x, player.position.z - z) < radius;
          const prompt = promptNear(-0.55, -2.1, 2.1) ? "E  ·  READ THE LETTER" : promptNear(2.8, -9.8, 2.4) ? "E  ·  EXAMINE THE CLOCK" : promptNear(-3.9, -9.2, 2.2) ? "E  ·  INSPECT THE PAINTING" : promptNear(0, -9.2, 2.2) ? "E  ·  TRY THE DOOR" : "";
          if (prompt !== lastPrompt) { lastPrompt = prompt; window.dispatchEvent(new CustomEvent("inbetween:prompt", { detail: prompt })); }
          target.set(player.position.x, 1.15, player.position.z);
          const desired = new THREE.Vector3(player.position.x, 3.1, player.position.z + 6.2);
          camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
          camera.lookAt(target);
          if (unlocked) {
            door.rotation.y = THREE.MathUtils.lerp(door.rotation.y, -1.2, delta * 1.2);
          }
          if (clockActivated) hand.rotation.z = THREE.MathUtils.lerp(hand.rotation.z, -2.4, delta * 0.9);
          if (clockActivated) painting.position.x = THREE.MathUtils.lerp(painting.position.x, -4.75, delta * 1.4);
          renderer.render(scene, camera);
        };
        animate();

        cleanup = () => {
          active = false;
          cancelAnimationFrame(frame);
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
          window.removeEventListener("inbetween:unlock", onUnlock);
          window.removeEventListener("inbetween:clock-solved", onClockSolved);
          resizeObserver.disconnect();
          scene.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material: any) => material.dispose());
            }
          });
          renderer.dispose();
        };
        engineRef.current = { dispose: () => cleanup?.() };
      } catch (error) {
        console.error("THE IN-BETWEEN failed to initialise", error);
        setEngineError("The 3D scene couldn't load. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void boot();
    return () => {
      cancelled = true;
      cleanup?.();
      engineRef.current = null;
    };
  }, [started]);

  useEffect(() => {
    const prompt = (event: Event) => setNearbyPrompt((event as CustomEvent<string>).detail || "");
    const letter = () => {
      if (!inventory.includes("The torn letter")) {
        setInventory((items) => [...items, "The torn letter"]);
        setMessage({ title: "A letter left behind", body: "“If you have found this room, the library has already noticed you. The clock remembers the minute the first door disappeared. 11:17.”" });
      } else setMessage({ title: "The torn letter", body: "The ink still points to the same time: 11:17." });
    };
    const clock = () => {
      if (inventory.includes("The torn letter")) {
        setClockSolved(true);
        window.dispatchEvent(new CustomEvent("inbetween:clock-solved"));
        setMessage({ title: "The clock begins to move", body: "11:17. A quiet click echoes through the library. Something behind the painting shifts." });
      } else setMessage({ title: "A stopped clock", body: "Its hands are frozen. You need to find a clue before changing the time." });
    };
    const painting = () => {
      if (clockSolved) {
        if (!inventory.includes("The brass key")) setInventory((items) => [...items, "The brass key"]);
        setMessage({ title: "A hidden compartment", body: "The painting slides aside. A small brass key rests in the hollow behind it." });
      } else setMessage({ title: "An old painting", body: "A library corridor is painted in the background. One tiny detail seems out of place." });
    };
    const door = () => {
      if (inventory.includes("The brass key")) {
        setDoorOpen(true);
        window.dispatchEvent(new CustomEvent("inbetween:unlock"));
        setMessage({ title: "The first door opens", body: "Beyond it is not the hallway you expected. A second library stretches into darkness. Chapter One is complete — and the real mystery is only beginning." });
      } else setMessage({ title: "A locked door", body: "The lock is old, but still intact. There must be a key somewhere in this room." });
    };
    window.addEventListener("inbetween:prompt", prompt);
    window.addEventListener("inbetween:letter", letter);
    window.addEventListener("inbetween:clock", clock);
    window.addEventListener("inbetween:painting", painting);
    window.addEventListener("inbetween:door", door);
    return () => {
      window.removeEventListener("inbetween:prompt", prompt);
      window.removeEventListener("inbetween:letter", letter);
      window.removeEventListener("inbetween:clock", clock);
      window.removeEventListener("inbetween:painting", painting);
      window.removeEventListener("inbetween:door", door);
    };
  }, [inventory, clockSolved]);

  const reset = () => {
    localStorage.removeItem(SAVE_KEY);
    setInventory([]);
    setClockSolved(false);
    setDoorOpen(false);
    setMessage({ title: "A new beginning", body: "Your story has been reset. The library is waiting." });
  };

  if (!started) {
    return (
      <section className="ib-page ib-title-page">
        <div className="ib-title-art">
          <div className="ib-title-glow" />
          <div className="ib-title-copy">
            <p className="ib-kicker">A MIUMI ORIGINAL ADVENTURE</p>
            <h1>THE <span>IN-BETWEEN</span></h1>
            <p className="ib-subtitle">Some doors are not meant to be found.</p>
            <p className="ib-intro">You wake in a library that has no windows, no visitors, and no memory of how you arrived. The clock has stopped. The exit is locked. Something is waiting beyond the shelves.</p>
            <button className="ib-primary" onClick={() => setStarted(true)}>ENTER THE LIBRARY <span>↗</span></button>
            <p className="ib-footnote">CHAPTER 01 · THE SILENT LIBRARY</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ib-page ib-game-page">
      <header className="ib-game-header">
        <div><p className="ib-kicker">MIUMI ORIGINAL · CHAPTER 01</p><h1>THE IN-BETWEEN</h1></div>
        <div className="ib-chapter-label"><span /> THE SILENT LIBRARY</div>
        <button className="ib-quiet-button" onClick={reset}>RESET STORY</button>
      </header>
      <div className="ib-game-layout">
        <div className="ib-world">
          <canvas ref={canvasRef} aria-label="Third-person 3D view of the Silent Library" />
          <div className="ib-world-top"><span>✦ THE SILENT LIBRARY</span><span>CHAPTER 01 / 04</span></div>
          <div className="ib-world-bottom"><span>W A S D / ARROW KEYS TO MOVE</span><span>E · INTERACT</span></div>
          {nearbyPrompt && <div className="ib-interaction-prompt">{nearbyPrompt}</div>}
          {loading && <div className="ib-loading"><span className="ib-loader" />Preparing the library…</div>}
          {engineError && <div className="ib-error">{engineError}</div>}
          <div className="ib-mobile-controls">
            <button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }))} onPointerLeave={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }))}>↑</button>
            <div><button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }))} onPointerLeave={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }))}>←</button><button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "s" }))} onPointerLeave={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "s" }))}>↓</button><button onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))} onPointerUp={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "d" }))} onPointerLeave={() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "d" }))}>→</button></div>
            <button className="ib-interact" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "e" }))}>E</button>
          </div>
        </div>
        <aside className="ib-sidebar">
          <div className="ib-side-section"><p className="ib-side-label">YOUR OBJECTIVE</p><h2>{doorOpen ? "Beyond the first door" : clockSolved ? "Find the hidden key" : "Find a way out"}</h2><p>{doorOpen ? "The door has opened. The next room is waiting." : clockSolved ? "The painting moved. Search behind it." : "Explore the room. Find clues that reveal how to unlock the exit."}</p></div>
          <div className="ib-side-section"><p className="ib-side-label">JOURNAL</p><div className="ib-journal-item"><span>01</span><div><strong>The clock</strong><small>{clockSolved ? "It moved at 11:17" : "Stopped at an unknown time"}</small></div></div><div className="ib-journal-item"><span>02</span><div><strong>The locked door</strong><small>{doorOpen ? "Opened" : "A key is missing"}</small></div></div></div>
          <div className="ib-side-section"><p className="ib-side-label">INVENTORY</p>{inventory.length ? inventory.map((item) => <div className="ib-inventory-item" key={item}><span>◇</span>{item}</div>) : <p className="ib-empty">Nothing collected yet.</p>}</div>
          <div className="ib-side-note">“The rooms remember what the people forget.”</div>
        </aside>
      </div>
      <div className="ib-game-footer"><span>Autosave enabled</span><span>Best experienced with headphones</span><span>© MIUMI · THE IN-BETWEEN</span></div>
      {message && <div className="ib-modal-backdrop" role="presentation" onClick={() => setMessage(null)}><div className="ib-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="ib-kicker">A DISCOVERY</p><h2>{message.title}</h2><p>{message.body}</p><button className="ib-primary" onClick={() => setMessage(null)}>CONTINUE <span>↗</span></button></div></div>}
    </section>
  );
}
