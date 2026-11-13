import { useEffect, useRef, useState } from "react";
import "./in-between.css";

type GameMessage = { title: string; body: string };
type ThreeModule = any;
type AvatarSettings = {
  presentation: "feminine" | "masculine" | "androgynous";
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "tied";
  outfit: string;
};
const DEFAULT_AVATAR: AvatarSettings = {
  presentation: "feminine",
  skin: "#d5a27e",
  hair: "#8a4933",
  hairStyle: "long",
  outfit: "#34473c",
};
const SKIN_OPTIONS = [{label:"Warm",value:"#bd896d"},{label:"Golden",value:"#d5a27e"},{label:"Light",value:"#edc5a5"},{label:"Deep",value:"#754b3b"},{label:"Rich",value:"#9a6249"}];
const HAIR_OPTIONS = [{label:"Espresso",value:"#241b18"},{label:"Chestnut",value:"#68412d"},{label:"Midnight",value:"#171b2b"},{label:"Auburn",value:"#8a4933"},{label:"Silver",value:"#aaa6a0"}];
const OUTFIT_OPTIONS = [{label:"Midnight blue",value:"#283746"},{label:"Forest",value:"#34473c"},{label:"Burgundy",value:"#633c43"},{label:"Charcoal",value:"#34343a"},{label:"Ivory",value:"#b7aa91"}];

const SAVE_KEY = "miumi-in-between-save-v1";

export default function InBetweenGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarPreviewRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<{ dispose: () => void } | null>(null);
  const gameShellRef = useRef<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState<GameMessage | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [clockSolved, setClockSolved] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engineError, setEngineError] = useState("");
  const [nearbyPrompt, setNearbyPrompt] = useState("");
  const [avatar, setAvatar] = useState<AvatarSettings>(DEFAULT_AVATAR);
  const progressRef = useRef({ clockSolved: false, doorOpen: false });

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === gameShellRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (gameShellRef.current?.requestFullscreen) await gameShellRef.current.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable in embedded or restricted browsers.
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { inventory?: string[]; clockSolved?: boolean; doorOpen?: boolean; avatar?: AvatarSettings };
        setInventory(Array.isArray(data.inventory) ? data.inventory : []);
        setClockSolved(Boolean(data.clockSolved));
        setDoorOpen(Boolean(data.doorOpen));
        if (data.avatar) {
          const hadOldTraveller = data.avatar.presentation !== "feminine";
          setAvatar(hadOldTraveller ? DEFAULT_AVATAR : { ...DEFAULT_AVATAR, ...data.avatar, presentation: "feminine", hairStyle: "long" });
        }
      }
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    progressRef.current = { clockSolved, doorOpen };
  }, [clockSolved, doorOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ inventory, clockSolved, doorOpen, avatar }));
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  }, [inventory, clockSolved, doorOpen, avatar]);

  // A separate lightweight 3D turntable lets players inspect their traveller
  // before starting. Rebuild only when appearance settings change.
  useEffect(() => {
    if (started || !avatarPreviewRef.current) return;
    let cancelled = false;
    let frame = 0;
    let renderer: any;
    let observer: ResizeObserver | undefined;
    let cleanup: (() => void) | undefined;
    const bootPreview = async () => {
      try {
        const THREE = await import(/* @vite-ignore */ "https://esm.sh/three@0.180.0") as ThreeModule;
        if (cancelled || !avatarPreviewRef.current) return;
        const canvas = avatarPreviewRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#171a20");
        scene.fog = new THREE.Fog("#171a20", 5, 13);
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
        camera.position.set(0, 1.55, 6.2);
        camera.lookAt(0, 1.05, 0);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        scene.add(new THREE.HemisphereLight("#d6d9e2", "#342b27", 2));
        const key = new THREE.DirectionalLight("#f4dfc1", 3);
        key.position.set(-3, 5, 4);
        key.castShadow = true;
        scene.add(key);
        const rim = new THREE.PointLight("#9db5d4", 16, 9);
        rim.position.set(2, 2.5, -2);
        scene.add(rim);
        const floor = new THREE.Mesh(new THREE.CircleGeometry(2.8, 48), new THREE.MeshStandardMaterial({ color: "#292a2d", roughness: 0.95 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.025;
        floor.receiveShadow = true;
        scene.add(floor);
        const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.12, 0.12, 48), new THREE.MeshStandardMaterial({ color: "#554536", metalness: 0.45, roughness: 0.48 }));
        platform.position.y = 0.04;
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        const portraitHalo = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.012, 8, 64), new THREE.MeshStandardMaterial({ color: "#b49a72", metalness: 0.45, roughness: 0.38 }));
        portraitHalo.position.y = 0.11; portraitHalo.rotation.x = Math.PI / 2; scene.add(portraitHalo);
        const character = new THREE.Group();
        character.position.y = 0.11;
        scene.add(character);
        const fallbackPreview = new THREE.Group();
        character.add(fallbackPreview);
        const material = (color: string, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
        const skin = material(avatar.skin);
        const hair = material(avatar.hair);
        const outfit = material(avatar.outfit);
        const shadowOutfit = material(new THREE.Color(avatar.outfit).multiplyScalar(0.68).getStyle());
        const boots = material("#171719");
        const brass = material("#b49a72", 0.4, 0.45);
        const part = (geometry: any, mat: any, x: number, y: number, z: number, parent: any = fallbackPreview) => {
          const mesh = new THREE.Mesh(geometry, mat);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const shoulder = avatar.presentation === "masculine" ? 0.39 : avatar.presentation === "feminine" ? 0.32 : 0.35;
        const hip = avatar.presentation === "feminine" ? 0.34 : 0.29;
        part(new THREE.CylinderGeometry(0.105, 0.12, 0.2, 18), skin, 0, 1.55, 0);
        const torso = part(new THREE.CapsuleGeometry(avatar.presentation === "masculine" ? 0.31 : 0.28, 0.62, 7, 18), outfit, 0, 1.13, 0);
        torso.scale.x = avatar.presentation === "masculine" ? 1.08 : 1;
        part(new THREE.BoxGeometry(hip * 2, 0.42, 0.22), shadowOutfit, 0, 0.76, 0.015);
        // Mira's signature field coat, layered waist sash and travel satchel.
        const skirtMat = material("#514047", 0.88);
        const coatSkirt = part(new THREE.CylinderGeometry(0.24, 0.39, 0.58, 8, 1, false), skirtMat, 0, 0.79, 0);
        coatSkirt.rotation.y = Math.PI / 8;
        for (let i = 0; i < 5; i++) {
          const pleat = part(new THREE.BoxGeometry(0.018, 0.43, 0.025), brass, -0.25 + i * 0.125, 0.79, -0.17);
          pleat.rotation.z = (i - 2) * 0.035;
        }
        const sash = part(new THREE.TorusGeometry(0.2, 0.035, 8, 28), brass, 0, 0.98, 0);
        sash.rotation.x = Math.PI / 2;
        const satchel = new THREE.Group(); satchel.position.set(0.34, 1.02, 0.19); fallbackPreview.add(satchel);
        part(new THREE.BoxGeometry(0.34, 0.36, 0.16), shadowOutfit, 0, 0, 0, satchel);
        part(new THREE.BoxGeometry(0.29, 0.11, 0.035), brass, 0, -0.04, -0.09, satchel);
        part(new THREE.TorusGeometry(0.045, 0.012, 6, 12), brass, 0, -0.04, -0.115, satchel);
        part(new THREE.SphereGeometry(0.235, 32, 28), skin, 0, 1.82, 0);
        part(new THREE.SphereGeometry(0.25, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.57), hair, 0, 1.88, 0);
        const hairMotion: any[] = [];
        if (avatar.hairStyle === "long") {
          // Sculpted back hair plus separate face-framing locks create a
          // recognisable original silhouette instead of a plain sphere cap.
          part(new THREE.CapsuleGeometry(0.22, 0.58, 7, 16), hair, 0, 1.48, 0.13);
          for (const side of [-1, 1]) {
            const lock = new THREE.Group();
            lock.position.set(side * 0.19, 1.72, 0.045);
            fallbackPreview.add(lock);
            part(new THREE.CapsuleGeometry(0.095, 0.46, 7, 14), hair, 0, -0.15, 0, lock);
            const curl = part(new THREE.SphereGeometry(0.105, 16, 12), hair, 0, -0.42, 0.015, lock);
            curl.scale.set(0.9, 0.72, 0.85);
            hairMotion.push({ pivot: lock, side });
          }
          const fringe = part(new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI, 0, Math.PI * 0.5), hair, 0, 1.93, -0.13);
          fringe.scale.set(1.1, 0.62, 0.72);
          const hairPin = part(new THREE.TorusGeometry(0.055, 0.014, 7, 18), brass, 0.17, 1.91, -0.19);
          hairPin.rotation.x = Math.PI / 2;
        } else if (avatar.hairStyle === "tied") {
          part(new THREE.SphereGeometry(0.12, 16, 12), hair, 0, 1.72, 0.22);
          const ponytail = new THREE.Group();
          ponytail.position.set(0, 1.62, 0.2);
          fallbackPreview.add(ponytail);
          part(new THREE.CapsuleGeometry(0.07, 0.22, 5, 10), hair, 0, -0.12, 0, ponytail);
          hairMotion.push({ pivot: ponytail, side: 0.7 });
        } else {
          part(new THREE.SphereGeometry(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hair, 0, 1.94, 0.015);
        }
        const eye = material("#241e1b", 0.45);
        const iris = material("#806044", 0.35, 0.05);
        part(new THREE.SphereGeometry(0.022, 10, 8), eye, -0.075, 1.83, -0.218);
        part(new THREE.SphereGeometry(0.022, 10, 8), eye, 0.075, 1.83, -0.218);
        // Face shaping: brows, nose bridge, ears and a subtle mouth make the
        // traveller read as a person from close-up and three-quarter angles.
        const eyeWhite = material("#e6ded0", 0.5);
        const brow = material(new THREE.Color(avatar.hair).multiplyScalar(0.72).getStyle());
        for (const x of [-0.075, 0.075]) {
          part(new THREE.SphereGeometry(0.031, 12, 10), eyeWhite, x, 1.835, -0.205);
          part(new THREE.SphereGeometry(0.013, 10, 8), iris, x, 1.833, -0.232);
          const lash = part(new THREE.CapsuleGeometry(0.008, 0.055, 3, 6), eye, x, 1.866, -0.221);
          lash.rotation.z = x < 0 ? -0.45 : 0.45;
          const browMesh = part(new THREE.CapsuleGeometry(0.012, 0.065, 3, 8), brow, x, 1.885, -0.202);
          browMesh.rotation.z = x < 0 ? -0.12 : 0.12;
        }
        const nose = part(new THREE.SphereGeometry(0.035, 12, 10), skin, 0, 1.785, -0.235);
        nose.scale.set(0.72, 1.25, 0.8);
        part(new THREE.CapsuleGeometry(0.008, 0.045, 3, 6), material("#80534a"), 0, 1.735, -0.222);
        for (const x of [-0.235, 0.235]) {
          const ear = part(new THREE.SphereGeometry(0.055, 12, 10), skin, x, 1.81, -0.005);
          ear.scale.set(0.55, 1, 0.65);
        }
        // Tailored traveller's coat: lapels, front seam, brass buttons and cuffs.
        const lapel = material(new THREE.Color(avatar.outfit).multiplyScalar(1.22).getStyle());
        const seam = material("#b49a72", 0.55, 0.25);
        for (const side of [-1, 1]) {
          const flap = part(new THREE.BoxGeometry(0.13, 0.48, 0.055), lapel, side * 0.105, 1.28, -0.255);
          flap.rotation.z = side * -0.24;
          part(new THREE.TorusGeometry(0.045, 0.009, 6, 14), seam, side * 0.105, 1.12, -0.257);
          const cuff = part(new THREE.CylinderGeometry(0.098, 0.098, 0.075, 16), seam, side * shoulder, 1.04, 0);
          cuff.rotation.z = Math.PI / 2;
        }
        part(new THREE.BoxGeometry(0.018, 0.65, 0.018), seam, 0, 1.12, -0.255);
        for (let i = 0; i < 3; i++) part(new THREE.SphereGeometry(0.018, 10, 8), brass, 0.055, 1.28 - i * 0.16, -0.275);
        const scarfPivot = new THREE.Group();
        scarfPivot.position.set(0, 1.52, -0.12);
        fallbackPreview.add(scarfPivot);
        const scarf = part(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), seam, 0, -0.06, -0.07, scarfPivot);
        scarf.rotation.z = 0.12;
        const coatTail = new THREE.Group();
        coatTail.position.set(0, 0.9, 0.13);
        fallbackPreview.add(coatTail);
        part(new THREE.BoxGeometry(0.43, 0.38, 0.075), shadowOutfit, 0, -0.18, 0, coatTail);
        const collarPin = part(new THREE.TorusGeometry(0.055, 0.012, 6, 16), brass, -0.18, 1.43, -0.22);
        collarPin.rotation.x = Math.PI / 2;
        part(new THREE.BoxGeometry(0.11, 0.28, 0.035), seam, 0.13, 1.28, -0.27);
        const limb = (x: number, y: number, length: number, width: number, mat: any) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, y, 0);
          fallbackPreview.add(pivot);
          part(new THREE.CapsuleGeometry(width, length, 6, 12), mat, 0, -length * 0.42, 0, pivot);
          return pivot;
        };
        const armL = limb(-shoulder, 1.37, 0.5, 0.095, outfit);
        const armR = limb(shoulder, 1.37, 0.5, 0.095, outfit);
        part(new THREE.SphereGeometry(0.09, 14, 12), skin, 0, -0.34, 0, armL);
        part(new THREE.SphereGeometry(0.09, 14, 12), skin, 0, -0.34, 0, armR);
        const legL = limb(-hip / 2, 0.67, 0.58, 0.105, shadowOutfit);
        const legR = limb(hip / 2, 0.67, 0.58, 0.105, shadowOutfit);
        for (const leg of [legL, legR]) part(new THREE.BoxGeometry(0.2, 0.13, 0.34), boots, 0, -0.49, -0.07, leg);
        const limbs = [armL, armR, legL, legR];

        // Use the same CC0 rigged Mira model in the character turntable.
        let previewMixer: any = null;
        const previewAnimationClock = new THREE.Clock();
        void (async () => {
          try {
            const loaderModule = await import(/* @vite-ignore */ "https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js");
            if (cancelled) return;
            const loader = new loaderModule.GLTFLoader();
            const gltf = await loader.loadAsync("https://grab3d.com/dl/woman-rigged/woman-rigged.glb");
            if (cancelled) return;
            const model = gltf.scene;
            const bounds = new THREE.Box3().setFromObject(model);
            const dimensions = bounds.getSize(new THREE.Vector3());
            const centre = bounds.getCenter(new THREE.Vector3());
            model.position.x -= centre.x;
            model.position.z -= centre.z;
            model.position.y -= bounds.min.y;
            model.scale.setScalar(1.78 / Math.max(dimensions.y, 0.01));
            model.rotation.y = Math.PI;
            model.traverse((object: any) => {
              if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            });
            character.add(model);
            fallbackPreview.visible = false;
            previewMixer = new THREE.AnimationMixer(model);
            const idleClip = gltf.animations.find((clip: any) => /idle|stand/i.test(clip.name)) || gltf.animations[0];
            if (idleClip) previewMixer.clipAction(idleClip).play();
          } catch (error) {
            console.warn("Mira preview is using its built-in fallback.", error);
          }
        })();
        let dragging = false;
        let lastX = 0;
        let rotationVelocity = 0;
        const down = (event: PointerEvent) => { dragging = true; lastX = event.clientX; canvas.setPointerCapture?.(event.pointerId); };
        const move = (event: PointerEvent) => {
          if (!dragging) return;
          const delta = event.clientX - lastX;
          character.rotation.y += delta * 0.012;
          rotationVelocity = delta * 0.0007;
          lastX = event.clientX;
        };
        const up = () => { dragging = false; };
        canvas.addEventListener("pointerdown", down);
        canvas.addEventListener("pointermove", move);
        canvas.addEventListener("pointerup", up);
        canvas.addEventListener("pointercancel", up);
        canvas.addEventListener("pointerleave", up);
        const resize = () => {
          if (!canvas.clientWidth || !canvas.clientHeight) return;
          renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
        };
        observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();
        const clock = new THREE.Clock();
        const animate = () => {
          if (cancelled) return;
          frame = requestAnimationFrame(animate);
          const elapsed = clock.getElapsedTime();
          if (!dragging) {
            character.rotation.y += rotationVelocity || 0.0025;
            rotationVelocity *= 0.94;
            if (Math.abs(rotationVelocity) < 0.00008) rotationVelocity = 0;
          }
          const idle = Math.sin(elapsed * 1.5) * 0.018;
          character.position.y = 0.11 + idle;
          const breeze = Math.sin(elapsed * 2.1);
          hairMotion.forEach(({ pivot, side }) => {
            pivot.rotation.x = Math.sin(elapsed * 2.4 + side) * 0.055;
            pivot.rotation.z = Math.sin(elapsed * 1.8 + side) * 0.035;
          });
          scarfPivot.rotation.x = breeze * 0.035;
          scarfPivot.rotation.z = 0.12 + breeze * 0.025;
          coatTail.rotation.x = Math.sin(elapsed * 2.0) * 0.035;
          coatSkirt.rotation.z = Math.sin(elapsed * 1.4) * 0.012;
          satchel.rotation.z = Math.sin(elapsed * 1.8) * 0.035;
          limbs[0].rotation.x = Math.sin(elapsed * 1.2) * 0.025;
          limbs[1].rotation.x = -Math.sin(elapsed * 1.2) * 0.025;
          if (previewMixer) previewMixer.update(previewAnimationClock.getDelta());
          renderer.render(scene, camera);
        };
        animate();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer?.disconnect();
          canvas.removeEventListener("pointerdown", down);
          canvas.removeEventListener("pointermove", move);
          canvas.removeEventListener("pointerup", up);
          canvas.removeEventListener("pointercancel", up);
          canvas.removeEventListener("pointerleave", up);
          scene.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((item: any) => item.dispose());
            }
          });
          renderer.dispose();
        };
      } catch {
        // The controls remain available if WebGL or the external module is unavailable.
      }
    };
    bootPreview();
    return () => {
      cancelled = true;
      cleanup?.();
      if (renderer) renderer.dispose();
    };
  }, [started, avatar]);

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
        const THREE = await import(/* @vite-ignore */ threeModuleUrl) as ThreeModule;
        if (cancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#10131a");
        scene.fog = new THREE.FogExp2("#11141b", 0.035);
        const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        scene.add(new THREE.HemisphereLight("#a9b9d1", "#29201b", 1.35));
        const moon = new THREE.DirectionalLight("#a8c2e5", 2.05);
        moon.position.set(-5, 9, 5);
        moon.castShadow = true;
        moon.shadow.mapSize.set(2048, 2048);
        moon.shadow.camera.near = 0.5;
        moon.shadow.camera.far = 32;
        moon.shadow.camera.left = -12;
        moon.shadow.camera.right = 12;
        moon.shadow.camera.top = 10;
        moon.shadow.camera.bottom = -10;
        moon.shadow.bias = -0.00018;
        moon.shadow.normalBias = 0.025;
        scene.add(moon);
        const warm = new THREE.PointLight("#e6a86c", 18, 19, 2);
        warm.position.set(0, 3.4, -5);
        scene.add(warm);
        const candleGlow = new THREE.PointLight("#d99558", 5.5, 8, 2);
        candleGlow.position.set(-2.8, 2.1, -2.6);
        scene.add(candleGlow);
        const coolFill = new THREE.PointLight("#829fc7", 4.5, 13, 2);
        coolFill.position.set(5.8, 2.8, 1.8);
        scene.add(coolFill);

        // A moving layer of fine dust catches the warm and moonlit beams.
        const dustCount = 260;
        const dustPositions = new Float32Array(dustCount * 3);
        const dustDrift = new Float32Array(dustCount * 3);
        for (let i = 0; i < dustCount; i++) {
          dustPositions[i * 3] = (Math.random() - 0.5) * 15;
          dustPositions[i * 3 + 1] = 0.25 + Math.random() * 5.1;
          dustPositions[i * 3 + 2] = -25 + Math.random() * 32;
          dustDrift[i * 3] = (Math.random() - 0.5) * 0.12;
          dustDrift[i * 3 + 1] = 0.025 + Math.random() * 0.07;
          dustDrift[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
        }
        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
        const dustMaterial = new THREE.PointsMaterial({ color: "#d7c9a9", size: 0.035, transparent: true, opacity: 0.48, depthWrite: false, sizeAttenuation: true });
        const dustMotes = new THREE.Points(dustGeometry, dustMaterial);
        scene.add(dustMotes);

        const mat = (color: string, roughness = 0.82, metalness = 0) =>
          new THREE.MeshStandardMaterial({ color, roughness, metalness });
        const floorMat = mat("#34343a", 0.94);
        const wallMat = mat("#4a4542", 0.96);
        const darkWood = mat("#211a18", 0.72);
        const wood = mat("#51382b", 0.68);
        const brass = mat("#9b7444", 0.3, 0.62);
        const paper = mat("#d7c8a7", 0.98);
        const makeBox = (w: number, h: number, d: number, material: ThreeModule["MeshStandardMaterial"], x: number, y: number, z: number) => {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          return mesh;
        };

        makeBox(16, 0.35, 18, floorMat, 0, -0.2, -2);
        makeBox(6.8, 6, 0.35, wallMat, -4.6, 2.8, -11);
        makeBox(6.8, 6, 0.35, wallMat, 4.6, 2.8, -11);
        makeBox(2.4, 1.85, 0.35, wallMat, 0, 5.08, -11);
        makeBox(0.35, 6, 18, wallMat, -8, 2.8, -2);
        makeBox(0.35, 6, 18, wallMat, 8, 2.8, -2);
        makeBox(16, 0.35, 18, darkWood, 0, 5.8, -2);

        // A tall stained-glass window gives the library a recognisable landmark
        // and casts a cool counter-light against the warm chandelier.
        const stainedGlass = new THREE.Mesh(
          new THREE.PlaneGeometry(2.35, 3.25),
          new THREE.MeshBasicMaterial({ color: "#7894b6", transparent: true, opacity: 0.34, side: THREE.DoubleSide })
        );
        stainedGlass.rotation.y = Math.PI / 2;
        stainedGlass.position.set(-7.77, 3.62, -6.3);
        scene.add(stainedGlass);
        const glassAccentA = new THREE.Mesh(
          new THREE.PlaneGeometry(0.68, 3.12),
          new THREE.MeshBasicMaterial({ color: "#9b7e9d", transparent: true, opacity: 0.38, side: THREE.DoubleSide })
        );
        glassAccentA.rotation.y = Math.PI / 2;
        glassAccentA.position.set(-7.75, 3.62, -6.86);
        scene.add(glassAccentA);
        const glassAccentB = new THREE.Mesh(
          new THREE.PlaneGeometry(0.68, 3.12),
          new THREE.MeshBasicMaterial({ color: "#c19b69", transparent: true, opacity: 0.34, side: THREE.DoubleSide })
        );
        glassAccentB.rotation.y = Math.PI / 2;
        glassAccentB.position.set(-7.75, 3.62, -5.74);
        scene.add(glassAccentB);
        for (const z of [-7.52, -6.3, -5.08]) makeBox(0.08, 3.55, 0.08, brass, -7.69, 3.62, z);
        makeBox(0.08, 0.08, 2.55, brass, -7.69, 3.62, -6.3);
        const windowArch = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.075, 8, 40, Math.PI), brass);
        windowArch.rotation.set(Math.PI / 2, Math.PI / 2, 0);
        windowArch.position.set(-7.68, 5.22, -6.3);
        scene.add(windowArch);
        const windowGlow = new THREE.PointLight("#91a9d2", 8, 12, 2);
        windowGlow.position.set(-6.7, 3.8, -6.3);
        scene.add(windowGlow);
        const windowBeamMaterial = new THREE.MeshBasicMaterial({
          color: "#9bb7df", transparent: true, opacity: 0.045,
          side: THREE.DoubleSide, depthWrite: false
        });
        const windowBeam = new THREE.Mesh(new THREE.ConeGeometry(1.25, 5.2, 32, 1, true), windowBeamMaterial);
        windowBeam.rotation.z = -Math.PI / 2;
        windowBeam.position.set(-5.15, 3.55, -6.3);
        scene.add(windowBeam);

        const doorPivot = new THREE.Group();
        doorPivot.position.set(-1.2, 0, -10.72); scene.add(doorPivot);
        const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.1, 0.22), darkWood);
        door.position.set(1.2, 2.05, 0); door.castShadow = true; door.receiveShadow = true; doorPivot.add(door);
        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 3.55, 0.055), wood);
        doorPanel.position.set(1.2, 2.05, -0.13); doorPanel.castShadow = true; doorPivot.add(doorPanel);
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), brass);
        knob.position.set(0.82, 1.8, -0.2); doorPivot.add(knob);
        makeBox(2.55, 0.16, 0.3, brass, 0, 4.2, -10.58);
        makeBox(16, 0.35, 15, mat("#292a30", 0.9), 0, -0.2, -18.5);
        makeBox(0.35, 6, 15, wallMat, -8, 2.8, -18.5);
        makeBox(0.35, 6, 15, wallMat, 8, 2.8, -18.5);
        makeBox(16, 6, 0.35, wallMat, 0, 2.8, -26);
        makeBox(16, 0.35, 15, darkWood, 0, 5.8, -18.5);
        makeBox(3.6, 0.18, 1.2, wood, 0, 1.05, -20.5);
        for (const x of [-1.45, 1.45]) makeBox(0.15, 1.0, 0.15, darkWood, x, 0.5, -20.5);
        const archiveGlow = new THREE.PointLight("#7f9bb9", 9, 13, 2);
        archiveGlow.position.set(0, 3.1, -23); scene.add(archiveGlow);
        makeBox(0.7, 1.3, 0.45, mat("#4a3b32"), -3.6, 0.65, -23.2);
        makeBox(0.7, 1.3, 0.45, mat("#3b4651"), 3.6, 0.65, -23.2);
        // Archive stacks make the second room visually distinct from the library.
        for (const side of [-1, 1]) {
          makeBox(0.55, 4.3, 3.8, darkWood, side * 6.65, 2.15, -20.4);
          for (let level = 0; level < 4; level++) {
            makeBox(0.62, 0.09, 3.7, wood, side * 6.65, 0.65 + level * 1.05, -20.4);
            for (let bookIndex = 0; bookIndex < 10; bookIndex++) {
              const archiveBook = makeBox(0.1, 0.48 + (bookIndex % 3) * 0.08, 0.2, mat(["#66504a", "#4b5a63", "#8a7657", "#51485d"][bookIndex % 4]), side * 6.65, 0.94 + level * 1.05, -21.95 + bookIndex * 0.34);
              archiveBook.rotation.z = (bookIndex % 2 ? 1 : -1) * 0.025;
            }
          }
        }

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

        // Architectural dressing turns the empty box into a deliberate,
        // old-world library: carpet, carved rails, ceiling ribs and sconces.
        makeBox(4.9, 0.035, 5.8, mat("#49333a", 0.98), 0, 0.005, -2.6);
        for (const x of [-2.28, 2.28]) makeBox(0.055, 0.025, 5.55, brass, x, 0.03, -2.6);
        for (const z of [-5.32, 0.12]) makeBox(4.62, 0.025, 0.055, brass, 0, 0.03, z);
        for (const side of [-1, 1]) {
          makeBox(0.12, 0.32, 17.2, darkWood, side * 7.72, 0.05, -2);
          makeBox(0.12, 0.22, 17.2, wood, side * 7.72, 5.45, -2);
          for (const z of [-9.2, -4.2, 0.8, 5.8]) {
            makeBox(0.24, 0.5, 0.24, brass, side * 7.58, 3.25, z);
            const sconce = new THREE.PointLight("#e6ad70", 3.8, 6, 2);
            sconce.position.set(side * 7.2, 3.45, z); scene.add(sconce);
            const sconceCup = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.24, 12), brass);
            sconceCup.position.set(side * 7.2, 3.2, z); sconceCup.rotation.x = Math.PI; scene.add(sconceCup);
          }
        }
        for (const z of [-9.4, -6.2, -3.0, 0.2, 3.4]) {
          makeBox(15.4, 0.18, 0.22, darkWood, 0, 5.35, z);
          makeBox(15.4, 0.07, 0.08, brass, 0, 5.23, z);
        }
        const chandelier = new THREE.Group();
        chandelier.position.set(0, 5.05, -5.2);
        scene.add(chandelier);
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 10), brass);
        chain.position.y = 0.36; chandelier.add(chain);
        const chandelierRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.055, 8, 36), brass);
        chandelierRing.rotation.x = Math.PI / 2; chandelierRing.position.y = -0.08; chandelier.add(chandelierRing);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.58, 8), brass);
          arm.position.set(Math.cos(angle) * 0.55, -0.02, Math.sin(angle) * 0.55);
          arm.rotation.z = Math.cos(angle) * 0.8; arm.rotation.x = Math.sin(angle) * 0.8; chandelier.add(arm);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), mat("#f5d7a1", 0.25, 0.1));
          bulb.position.set(Math.cos(angle) * 0.82, -0.1, Math.sin(angle) * 0.82); chandelier.add(bulb);
        }
        const chandelierLight = new THREE.PointLight("#e9bd83", 10, 12, 2);
        chandelierLight.position.set(0, 4.65, -5.2); scene.add(chandelierLight);

        // Central reading table and scattered objects.
        makeBox(3.2, 0.18, 1.8, wood, 0, 1.15, -2.2);
        for (const x of [-1.35, 1.35]) for (const z of [-2.85, -1.55]) makeBox(0.16, 1.1, 0.16, darkWood, x, 0.55, z);
        makeBox(0.9, 0.07, 0.65, paper, -0.55, 1.28, -2.1);
        const closedBook = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.11, 0.42), mat("#5b3940"));
        closedBook.position.set(0.72, 1.32, -2.12); closedBook.rotation.y = 0.18; closedBook.castShadow = true; scene.add(closedBook);
        const bookPages = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.035, 0.38), paper);
        bookPages.position.set(0.72, 1.39, -2.12); bookPages.rotation.y = 0.18; scene.add(bookPages);
        const pagePivot = new THREE.Group(); pagePivot.position.set(0.45, 1.42, -2.12); scene.add(pagePivot);
        const turningPage = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.34), paper);
        turningPage.position.set(0.13, 0, 0); turningPage.rotation.y = -Math.PI / 2; pagePivot.add(turningPage);
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
        const paintingArt = makeBox(1.35, 1.05, 0.05, mat("#172b2a"), -3.9, 3.35, -10.62);
        // Pillars and a warm hanging light give the room depth.
        for (const x of [-4.7, 4.7]) makeBox(0.42, 5.5, 0.42, mat("#393434"), x, 2.65, -8.9);
        const lamp = new THREE.PointLight("#f2bd7b", 24, 9, 2);
        lamp.position.set(0, 4.8, -1.5);
        scene.add(lamp);
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.55, 24, 1, true), brass);
        lampShade.position.set(0, 4.7, -1.5);
        scene.add(lampShade);

        // Interactive furniture and clues: drawers, a photograph, a wardrobe,
        // and a ledger waiting in the archive.
        const sideCabinet = makeBox(1.05, 1.05, 0.8, darkWood, -3.35, 0.55, -4.4);
        const drawerFront = makeBox(0.9, 0.28, 0.12, wood, -3.35, 0.82, -3.98);
        const drawerHandle = makeBox(0.16, 0.035, 0.045, brass, -3.35, 0.82, -3.905);
        const photoFrame = makeBox(0.72, 0.92, 0.12, brass, 5.8, 2.15, -5.8);
        const photoImage = makeBox(0.58, 0.76, 0.035, mat("#59646a"), 5.8, 2.15, -5.7);
        const wardrobe = new THREE.Group();
        wardrobe.position.set(5.85, 0, -18.1);
        scene.add(wardrobe);
        const wardrobeBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 3.4, 0.85), darkWood);
        wardrobeBody.position.y = 1.7; wardrobeBody.castShadow = true; wardrobe.add(wardrobeBody);
        const wardrobeDoorL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.25, 0.08), wood);
        wardrobeDoorL.position.set(-0.33, 1.7, -0.47); wardrobe.add(wardrobeDoorL);
        const wardrobeDoorR = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.25, 0.08), wood);
        wardrobeDoorR.position.set(0.33, 1.7, -0.47); wardrobe.add(wardrobeDoorR);
        const wardrobeHandleL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.05), brass);
        wardrobeHandleL.position.set(0.2, 0, -0.055); wardrobeDoorL.add(wardrobeHandleL);
        const wardrobeHandleR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.05), brass);
        wardrobeHandleR.position.set(-0.2, 0, -0.055); wardrobeDoorR.add(wardrobeHandleR);
        const archiveLedger = makeBox(0.7, 0.09, 0.52, paper, 0, 1.22, -20.5);
        const ledgerSeal = makeBox(0.12, 0.025, 0.12, brass, 0, 1.28, -20.5);

        // Build the player's customised human character from reusable 3D parts.
        // This keeps appearance choices local and avoids a generic sample character.
        const player = new THREE.Group();
        scene.add(player);
        player.position.set(0, 0, 4.8);
        const fallbackGroup = new THREE.Group();
        player.add(fallbackGroup);
        const skinMat = mat(avatar.skin, 0.78);
        const hairMat = mat(avatar.hair, 0.9);
        const outfitMat = mat(avatar.outfit, 0.88);
        const darkOutfitMat = mat(new THREE.Color(avatar.outfit).multiplyScalar(0.72).getStyle(), 0.9);
        const bootMat = mat("#171719", 0.7);
        const trimMat = mat("#b49a72", 0.48, 0.35);
        const makePart = (geometry: any, material: any, x: number, y: number, z: number, parent: any = fallbackGroup) => {
          const part = new THREE.Mesh(geometry, material);
          part.position.set(x, y, z);
          part.castShadow = true;
          part.receiveShadow = true;
          parent.add(part);
          return part;
        };
        const shoulder = avatar.presentation === "masculine" ? 0.39 : avatar.presentation === "feminine" ? 0.32 : 0.35;
        const hip = avatar.presentation === "feminine" ? 0.34 : 0.29;
        makePart(new THREE.CylinderGeometry(0.105, 0.12, 0.2, 16), skinMat, 0, 1.55, 0);
        const torso = makePart(new THREE.CapsuleGeometry(avatar.presentation === "masculine" ? 0.31 : 0.28, 0.62, 7, 16), outfitMat, 0, 1.13, 0);
        torso.scale.x = avatar.presentation === "masculine" ? 1.08 : 1;
        makePart(new THREE.BoxGeometry(hip * 2, 0.42, 0.22), darkOutfitMat, 0, 0.76, 0.015);
        // Mira Vale's signature field coat, pleated travel skirt and satchel.
        const skirtMat = mat("#514047", 0.88);
        const coatSkirt = makePart(new THREE.CylinderGeometry(0.24, 0.39, 0.58, 8, 1, false), skirtMat, 0, 0.79, 0);
        coatSkirt.rotation.y = Math.PI / 8;
        for (let i = 0; i < 5; i++) {
          const pleat = makePart(new THREE.BoxGeometry(0.018, 0.43, 0.025), trimMat, -0.25 + i * 0.125, 0.79, -0.17);
          pleat.rotation.z = (i - 2) * 0.035;
        }
        const sash = makePart(new THREE.TorusGeometry(0.2, 0.035, 8, 28), trimMat, 0, 0.98, 0);
        sash.rotation.x = Math.PI / 2;
        const satchel = new THREE.Group(); satchel.position.set(0.34, 1.02, 0.19); fallbackGroup.add(satchel);
        makePart(new THREE.BoxGeometry(0.34, 0.36, 0.16), darkOutfitMat, 0, 0, 0, satchel);
        makePart(new THREE.BoxGeometry(0.29, 0.11, 0.035), trimMat, 0, -0.04, -0.09, satchel);
        makePart(new THREE.TorusGeometry(0.045, 0.012, 6, 12), trimMat, 0, -0.04, -0.115, satchel);
        makePart(new THREE.SphereGeometry(0.235, 32, 28), skinMat, 0, 1.82, 0);
        const facePlate = makePart(new THREE.SphereGeometry(0.19, 28, 20, 0, Math.PI, 0.15, Math.PI * 0.7), skinMat, 0, 1.81, -0.035);
        facePlate.scale.set(0.98, 0.98, 0.9);
        makePart(new THREE.SphereGeometry(0.25, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.57), hairMat, 0, 1.88, 0);
        const hairMotion: any[] = [];
        if (avatar.hairStyle === "long") {
          makePart(new THREE.CapsuleGeometry(0.22, 0.58, 7, 16), hairMat, 0, 1.48, 0.13);
          for (const side of [-1, 1]) {
            const lock = new THREE.Group();
            lock.position.set(side * 0.19, 1.72, 0.045);
            fallbackGroup.add(lock);
            makePart(new THREE.CapsuleGeometry(0.095, 0.46, 7, 14), hairMat, 0, -0.15, 0, lock);
            const curl = makePart(new THREE.SphereGeometry(0.105, 16, 12), hairMat, 0, -0.42, 0.015, lock);
            curl.scale.set(0.9, 0.72, 0.85);
            hairMotion.push({ pivot: lock, side });
          }
          const fringe = makePart(new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI, 0, Math.PI * 0.5), hairMat, 0, 1.93, -0.13);
          fringe.scale.set(1.1, 0.62, 0.72);
          const hairPin = makePart(new THREE.TorusGeometry(0.055, 0.014, 7, 18), trimMat, 0.17, 1.91, -0.19);
          hairPin.rotation.x = Math.PI / 2;
        } else if (avatar.hairStyle === "tied") {
          makePart(new THREE.SphereGeometry(0.12, 16, 12), hairMat, 0, 1.72, 0.22);
          const ponytail = new THREE.Group();
          ponytail.position.set(0, 1.62, 0.2);
          fallbackGroup.add(ponytail);
          makePart(new THREE.CapsuleGeometry(0.07, 0.22, 5, 10), hairMat, 0, -0.12, 0, ponytail);
          hairMotion.push({ pivot: ponytail, side: 0.7 });
        } else {
          makePart(new THREE.SphereGeometry(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hairMat, 0, 1.94, 0.015);
        }
        // Small facial details face toward the camera/front of the character.
        const eyeMat = mat("#241e1b", 0.45);
        const irisMat = mat("#806044", 0.35, 0.05);
        makePart(new THREE.SphereGeometry(0.022, 10, 8), eyeMat, -0.075, 1.83, -0.218);
        makePart(new THREE.SphereGeometry(0.022, 10, 8), eyeMat, 0.075, 1.83, -0.218);
        const eyeWhiteMat = mat("#e6ded0", 0.5);
        const browMat = mat(new THREE.Color(avatar.hair).multiplyScalar(0.72).getStyle());
        for (const x of [-0.075, 0.075]) {
          makePart(new THREE.SphereGeometry(0.031, 12, 10), eyeWhiteMat, x, 1.835, -0.205);
          makePart(new THREE.SphereGeometry(0.013, 10, 8), irisMat, x, 1.833, -0.232);
          const lash = makePart(new THREE.CapsuleGeometry(0.008, 0.055, 3, 6), eyeMat, x, 1.866, -0.221);
          lash.rotation.z = x < 0 ? -0.45 : 0.45;
          const brow = makePart(new THREE.CapsuleGeometry(0.012, 0.065, 3, 8), browMat, x, 1.885, -0.202);
          brow.rotation.z = x < 0 ? -0.12 : 0.12;
        }
        const nose = makePart(new THREE.SphereGeometry(0.035, 12, 10), skinMat, 0, 1.785, -0.235);
        nose.scale.set(0.72, 1.25, 0.8);
        makePart(new THREE.CapsuleGeometry(0.008, 0.045, 3, 6), mat("#80534a"), 0, 1.735, -0.222);
        for (const x of [-0.235, 0.235]) {
          const ear = makePart(new THREE.SphereGeometry(0.055, 12, 10), skinMat, x, 1.81, -0.005);
          ear.scale.set(0.55, 1, 0.65);
        }
        // A recognisable tailored coat with layered lapels, stitching and buttons.
        const lapelMat = mat(new THREE.Color(avatar.outfit).multiplyScalar(1.22).getStyle());
        const stitchMat = mat("#b49a72", 0.55, 0.25);
        for (const side of [-1, 1]) {
          const flap = makePart(new THREE.BoxGeometry(0.13, 0.48, 0.055), lapelMat, side * 0.105, 1.28, -0.255);
          flap.rotation.z = side * -0.24;
          makePart(new THREE.TorusGeometry(0.045, 0.009, 6, 14), stitchMat, side * 0.105, 1.12, -0.257);
          const cuff = makePart(new THREE.CylinderGeometry(0.098, 0.098, 0.075, 16), stitchMat, side * shoulder, 1.04, 0);
          cuff.rotation.z = Math.PI / 2;
        }
        makePart(new THREE.BoxGeometry(0.018, 0.65, 0.018), stitchMat, 0, 1.12, -0.255);
        for (let i = 0; i < 3; i++) makePart(new THREE.SphereGeometry(0.018, 10, 8), trimMat, 0.055, 1.28 - i * 0.16, -0.275);
        const scarfPivot = new THREE.Group();
        scarfPivot.position.set(0, 1.52, -0.12);
        fallbackGroup.add(scarfPivot);
        const scarf = makePart(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), stitchMat, 0, -0.06, -0.07, scarfPivot);
        scarf.rotation.z = 0.12;
        const coatTail = new THREE.Group();
        coatTail.position.set(0, 0.9, 0.13);
        fallbackGroup.add(coatTail);
        makePart(new THREE.BoxGeometry(0.43, 0.38, 0.075), darkOutfitMat, 0, -0.18, 0, coatTail);
        const collarPin = makePart(new THREE.TorusGeometry(0.055, 0.012, 6, 16), trimMat, -0.18, 1.43, -0.22);
        collarPin.rotation.x = Math.PI / 2;
        makePart(new THREE.BoxGeometry(0.11, 0.28, 0.035), stitchMat, 0.13, 1.28, -0.27);
        const limb = (x: number, y: number, length: number, width: number, material: any) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, y, 0);
          fallbackGroup.add(pivot);
          makePart(new THREE.CapsuleGeometry(width, length, 6, 12), material, 0, -length * 0.42, 0, pivot);
          return pivot;
        };
        const armL = limb(-shoulder, 1.37, 0.5, 0.095, outfitMat);
        const armR = limb(shoulder, 1.37, 0.5, 0.095, outfitMat);
        makePart(new THREE.SphereGeometry(0.09, 14, 12), skinMat, 0, -0.34, 0, armL);
        makePart(new THREE.SphereGeometry(0.09, 14, 12), skinMat, 0, -0.34, 0, armR);
        const legL = limb(-hip / 2, 0.67, 0.58, 0.105, darkOutfitMat);
        const legR = limb(hip / 2, 0.67, 0.58, 0.105, darkOutfitMat);
        for (const leg of [legL, legR]) makePart(new THREE.BoxGeometry(0.2, 0.13, 0.34), bootMat, 0, -0.49, -0.07, leg);
        const playerLimbs = [armL, armR, legL, legR];
        const keys = new Set<string>();
        let unlocked = progressRef.current.doorOpen;
        let doorIsOpen = unlocked;
        let clockActivated = progressRef.current.clockSolved;
        let enteredArchive = false;
        let drawerIsOpen = false;
        let wardrobeIsOpen = false;
        let hidingInWardrobe = false;
        if (doorIsOpen) doorPivot.rotation.y = -1.42;
        if (clockActivated) painting.position.x = -4.75;
        let lastPrompt = "";
        const onUnlock = () => { unlocked = true; doorIsOpen = true; };
        const onClockSolved = () => { clockActivated = true; };
        window.addEventListener("inbetween:unlock", onUnlock);
        window.addEventListener("inbetween:clock-solved", onClockSolved);
        let cameraYaw = 0;
        let cameraPitch = 0.16;
        let touchLookActive = false;
        let lastTouchX = 0, lastTouchY = 0;
        const onCanvasClick = () => { if (document.pointerLockElement !== canvas && canvas.requestPointerLock) canvas.requestPointerLock(); };
        const onMouseMove = (event: MouseEvent) => {
          if (document.pointerLockElement !== canvas) return;
          cameraYaw -= event.movementX * 0.0024;
          cameraPitch = THREE.MathUtils.clamp(cameraPitch + event.movementY * 0.0018, -0.12, 0.62);
        };
        const onTouchStart = (event: PointerEvent) => {
          if (event.pointerType !== "touch" || (event.target as HTMLElement)?.closest?.(".ib-mobile-controls")) return;
          touchLookActive = true; lastTouchX = event.clientX; lastTouchY = event.clientY;
        };
        const onTouchMove = (event: PointerEvent) => {
          if (!touchLookActive || event.pointerType !== "touch") return;
          cameraYaw -= (event.clientX-lastTouchX)*0.006;
          cameraPitch = THREE.MathUtils.clamp(cameraPitch+(event.clientY-lastTouchY)*0.003,-0.12,0.62);
          lastTouchX=event.clientX; lastTouchY=event.clientY;
        };
        const onTouchEnd = () => { touchLookActive = false; };
        const onKeyDown = (event: KeyboardEvent) => {
          if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
          keys.add(event.key.toLowerCase());
          if (event.key.toLowerCase() === "e") interact();
        };
        const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
        canvas.addEventListener("click", onCanvasClick);
        canvas.addEventListener("pointerdown", onTouchStart);
        canvas.addEventListener("pointermove", onTouchMove);
        canvas.addEventListener("pointerup", onTouchEnd);
        canvas.addEventListener("pointercancel", onTouchEnd);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        let active = true;
        let frame = 0;
        const clockTimer = new THREE.Clock();

        // Mira now uses a real skinned, rigged character with authored walk/run
        // clips. The CC0 model is hosted by Grab3D; the procedural Mira remains
        // as a graceful fallback if the asset host or loader is unavailable.
        let characterMixer: any = null;
        let idleAction: any = null;
        let walkAction: any = null;
        let currentCharacterAction: any = null;
        let modelReady = false;
        const switchCharacterAction = (next: any) => {
          if (!next || currentCharacterAction === next) return;
          next.reset().fadeIn(0.22).play();
          if (currentCharacterAction) currentCharacterAction.fadeOut(0.22);
          currentCharacterAction = next;
        };
        void (async () => {
          try {
            const loaderModule = await import(/* @vite-ignore */ "https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js");
            if (!active) return;
            const loader = new loaderModule.GLTFLoader();
            const gltf = await loader.loadAsync("https://grab3d.com/dl/woman-rigged/woman-rigged.glb");
            if (!active) {
              gltf.scene.traverse((object: any) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                  const materials = Array.isArray(object.material) ? object.material : [object.material];
                  materials.forEach((item: any) => item.dispose());
                }
              });
              return;
            }
            const model = gltf.scene;
            const bounds = new THREE.Box3().setFromObject(model);
            const dimensions = bounds.getSize(new THREE.Vector3());
            const centre = bounds.getCenter(new THREE.Vector3());
            model.position.x -= centre.x;
            model.position.z -= centre.z;
            model.position.y -= bounds.min.y;
            model.scale.setScalar(1.78 / Math.max(dimensions.y, 0.01));
            // glTF character assets commonly face +Z; Mira faces into the room.
            model.rotation.y = Math.PI;
            model.traverse((object: any) => {
              if (!object.isMesh) return;
              object.castShadow = true;
              object.receiveShadow = true;
              if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach((material: any) => {
                  if ("roughness" in material) material.roughness = Math.max(0.42, material.roughness ?? 0.7);
                });
              }
            });
            player.add(model);
            fallbackGroup.visible = false;
            characterMixer = new THREE.AnimationMixer(model);
            const idleClip = gltf.animations.find((clip: any) => /idle|stand/i.test(clip.name)) || gltf.animations[0];
            const walkClip = gltf.animations.find((clip: any) => /walk|run/i.test(clip.name));
            idleAction = idleClip ? characterMixer.clipAction(idleClip) : null;
            walkAction = walkClip ? characterMixer.clipAction(walkClip) : idleAction;
            switchCharacterAction(idleAction);
            modelReady = true;
          } catch (error) {
            console.warn("Mira's rigged model could not be loaded; using the built-in fallback.", error);
          }
        })();
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
          } else if (near(0, -9.2, 2.5)) {
            if (unlocked) doorIsOpen = !doorIsOpen;
            else window.dispatchEvent(new CustomEvent("inbetween:door"));
          } else if (near(-3.35, -4.4, 1.8)) {
            drawerIsOpen = !drawerIsOpen;
            if (drawerIsOpen && !inventory.includes("Old photograph")) {
              setInventory((items) => [...items, "Old photograph"]);
              setMessage({ title: "Something inside the drawer", body: "A faded photograph rests beneath the dust. On its back, someone has written: 'The room remembers what the people forget.' It has been added to your inventory." });
            } else {
              setMessage({ title: drawerIsOpen ? "Drawer opened" : "Drawer closed", body: "The wooden drawer slides with a soft, reluctant scrape." });
            }
          } else if (near(5.8, -5.8, 2.0)) {
            setMessage({ title: "The photograph", body: "A family stands in front of this very library. But there is a fourth shadow in the picture, although only three people are visible." });
          } else if (near(5.85, -18.1, 2.0)) {
            wardrobeIsOpen = !wardrobeIsOpen;
            hidingInWardrobe = wardrobeIsOpen;
            player.visible = !hidingInWardrobe;
            setMessage({ title: wardrobeIsOpen ? "Inside the wardrobe" : "Back in the archive", body: wardrobeIsOpen ? "You slip inside and pull the wardrobe doors nearly shut. The archive sounds distant from here." : "You step out into the archive. The wardrobe doors creak closed behind you." });
          } else if (near(0, -20.5, 2.0)) {
            if (!inventory.includes("Archive ledger")) setInventory((items) => [...items, "Archive ledger"]);
            setMessage({ title: "The archive ledger", body: "The ledger lists rooms that do not appear on any floor plan. One entry is circled: THE FORGOTTEN GARDEN. The ledger has been added to your inventory." });
          }
        }

        const animate = () => {
          if (!active) return;
          frame = requestAnimationFrame(animate);
          const delta = Math.min(clockTimer.getDelta(), 0.04);
          const forward = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
          const sideways = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
          const moving = forward !== 0 || sideways !== 0;
          if (characterMixer) {
            characterMixer.update(delta);
            switchCharacterAction(moving ? walkAction : idleAction);
          }
          if (moving) {
            const forwardVector = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
            const rightVector = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
            const direction = forwardVector.multiplyScalar(forward).add(rightVector.multiplyScalar(sideways)).normalize();
            const step = delta * 3.2;
            const blockers = [
              { x: 0, z: -2.2, hx: 1.82, hz: 1.12 },
              { x: -4.7, z: -8.9, hx: 0.48, hz: 0.48 },
              { x: 4.7, z: -8.9, hx: 0.48, hz: 0.48 },
              { x: -3.9, z: -10.1, hx: 0.72, hz: 0.35 },
              { x: -3.35, z: -4.4, hx: 0.62, hz: 0.52 },
            ];
            const collides = (x: number, z: number) => blockers.some((b) => Math.abs(x - b.x) < b.hx && Math.abs(z - b.z) < b.hz);
            const nextX = THREE.MathUtils.clamp(player.position.x + direction.x * step, -5.8, 5.8);
            const nextZ = THREE.MathUtils.clamp(player.position.z + direction.z * step, unlocked ? -24.8 : -9.5, 7.2);
            if (!collides(nextX, player.position.z)) player.position.x = nextX;
            if (!collides(player.position.x, nextZ)) player.position.z = nextZ;
            player.rotation.y = Math.atan2(direction.x, direction.z);
          }
          {
            const swing = moving ? Math.sin(clockTimer.elapsedTime * 9) * 0.48 : Math.sin(clockTimer.elapsedTime * 1.7) * 0.025;
            const [armL, armR, legL, legR] = playerLimbs;
            armL.rotation.x = swing; armR.rotation.x = -swing;
            legL.rotation.x = -swing; legR.rotation.x = swing;
            const breeze = Math.sin(clockTimer.elapsedTime * (moving ? 9 : 2.1));
            hairMotion.forEach(({ pivot, side }) => {
              pivot.rotation.x = Math.sin(clockTimer.elapsedTime * (moving ? 9 : 2.4) + side) * (moving ? 0.13 : 0.045);
              pivot.rotation.z = Math.sin(clockTimer.elapsedTime * 2 + side) * 0.035;
            });
            scarfPivot.rotation.x = breeze * (moving ? 0.075 : 0.03);
            scarfPivot.rotation.z = 0.12 + breeze * 0.025;
            coatTail.rotation.x = Math.sin(clockTimer.elapsedTime * (moving ? 9 : 2)) * (moving ? 0.085 : 0.025);
            coatSkirt.rotation.z = Math.sin(clockTimer.elapsedTime * (moving ? 9 : 1.5)) * (moving ? 0.045 : 0.012);
            satchel.rotation.z = Math.sin(clockTimer.elapsedTime * (moving ? 9 : 1.8)) * (moving ? 0.09 : 0.025);
            // Gentle counter-sway and vertical foot rhythm keep the gait from
            // looking like a rigid sliding mannequin.
            player.position.y = moving ? Math.abs(Math.sin(clockTimer.elapsedTime * 9)) * 0.045 : Math.sin(clockTimer.elapsedTime * 1.7) * 0.012;
            player.rotation.z = moving ? Math.sin(clockTimer.elapsedTime * 4.5) * 0.018 : 0;
          }
          const promptNear = (x: number, z: number, radius: number) => Math.hypot(player.position.x - x, player.position.z - z) < radius;
          const doorNear = promptNear(0, -9.2, 2.5);
          const inArchive = player.position.z < -12.2;
          const prompt = promptNear(-0.55, -2.1, 2.1) ? "E  ·  READ THE LETTER" : promptNear(2.8, -9.8, 2.4) ? "E  ·  EXAMINE THE CLOCK" : promptNear(-3.9, -9.2, 2.2) ? "E  ·  INSPECT THE PAINTING" : doorNear ? (unlocked ? "E  ·  OPEN / CLOSE DOOR" : "E  ·  TRY THE DOOR") : !inArchive && promptNear(-3.35, -4.4, 1.8) ? "E  ·  OPEN DRAWER" : !inArchive && promptNear(5.8, -5.8, 2) ? "E  ·  INSPECT PHOTOGRAPH" : inArchive && promptNear(5.85, -18.1, 2) ? (wardrobeIsOpen ? "E  ·  LEAVE WARDROBE" : "E  ·  HIDE IN WARDROBE") : inArchive && promptNear(0, -20.5, 2) ? "E  ·  READ LEDGER" : "";
          if (prompt !== lastPrompt) { lastPrompt = prompt; window.dispatchEvent(new CustomEvent("inbetween:prompt", { detail: prompt })); }
          target.set(player.position.x, 1.15, player.position.z);
          const horizontalDistance = Math.cos(cameraPitch) * 6.2;
          const desired = new THREE.Vector3(player.position.x + Math.sin(cameraYaw)*horizontalDistance, 3.1 + Math.sin(cameraPitch)*6.2, player.position.z + Math.cos(cameraYaw)*horizontalDistance);
          camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
          camera.lookAt(target);
          doorPivot.rotation.y = THREE.MathUtils.lerp(doorPivot.rotation.y, doorIsOpen ? -1.42 : 0, delta * 2.2);
          drawerFront.position.z = THREE.MathUtils.lerp(drawerFront.position.z, drawerIsOpen ? -3.48 : -3.98, delta * 3);
          drawerHandle.position.z = THREE.MathUtils.lerp(drawerHandle.position.z, drawerIsOpen ? -3.405 : -3.905, delta * 3);
          wardrobeDoorL.rotation.y = THREE.MathUtils.lerp(wardrobeDoorL.rotation.y, wardrobeIsOpen ? -0.95 : 0, delta * 2.5);
          wardrobeDoorR.rotation.y = THREE.MathUtils.lerp(wardrobeDoorR.rotation.y, wardrobeIsOpen ? 0.95 : 0, delta * 2.5);
          if (unlocked && !enteredArchive && player.position.z < -12.2) {
            enteredArchive = true;
            setTimeout(() => setMessage({ title:"The hidden archive", body:"The library was only the first room. Shelves of forgotten records stretch into the dark. Somewhere in here, another door is waiting." }), 250);
          }
          if (clockActivated) hand.rotation.z = THREE.MathUtils.lerp(hand.rotation.z, -2.4, delta * 0.9);
          if (clockActivated) {
            painting.position.x = THREE.MathUtils.lerp(painting.position.x, -4.75, delta * 1.4);
            paintingArt.position.x = THREE.MathUtils.lerp(paintingArt.position.x, -4.75, delta * 1.4);
          }
          // Small continuous motion makes the room feel inhabited, not static.
          const time = clockTimer.elapsedTime;
          warm.intensity = 18 + Math.sin(time * 2.1) * 1.1 + Math.sin(time * 7.4) * 0.45;
          candleGlow.intensity = 5.5 + Math.sin(time * 5.2) * 0.75;
          chandelierLight.intensity = 10 + Math.sin(time * 1.8) * 0.55;
          windowGlow.intensity = 7.5 + Math.sin(time * 1.35) * 0.65;
          windowBeamMaterial.opacity = 0.04 + Math.sin(time * 0.8) * 0.006;
          chandelier.rotation.z = Math.sin(time * 0.55) * 0.018;
          pagePivot.rotation.y = -0.15 + Math.sin(time * 0.8) * 0.09;
          const dust = dustGeometry.attributes.position;
          for (let i = 0; i < dustCount; i++) {
            const x = dust.getX(i) + dustDrift[i * 3] * delta;
            const y = dust.getY(i) + dustDrift[i * 3 + 1] * delta;
            const z = dust.getZ(i) + dustDrift[i * 3 + 2] * delta;
            dust.setXYZ(i, x > 7.5 ? -7.5 : x < -7.5 ? 7.5 : x, y > 5.6 ? 0.25 : y, z > 7 ? -25 : z < -25 ? 7 : z);
          }
          dust.needsUpdate = true;
          renderer.render(scene, camera);
        };
        animate();

        cleanup = () => {
          active = false;
          cancelAnimationFrame(frame);
          window.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("keyup", onKeyUp);
          window.removeEventListener("mousemove", onMouseMove);
          canvas.removeEventListener("click", onCanvasClick);
          canvas.removeEventListener("pointerdown", onTouchStart);
          canvas.removeEventListener("pointermove", onTouchMove);
          canvas.removeEventListener("pointerup", onTouchEnd);
          canvas.removeEventListener("pointercancel", onTouchEnd);
          if (document.pointerLockElement === canvas) document.exitPointerLock();
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
        setMessage({ title: "A letter in Mira's handwriting", body: "“Mira — if you are reading this, the library has found you again. Set the clock to 11:17. Do not trust the room that looks familiar. You wrote this before you arrived.” The handwriting is unmistakably yours, but the paper is older than the building." });
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
            <p className="ib-intro">Mira Vale is an apprentice archivist who discovers a letter written in her own handwriting — dated tomorrow. It leads her to a library missing from every map. The clock is frozen at 11:17, and the only exit opens into a room that should not exist.</p>
            <div className="ib-avatar-studio">
              <div className="ib-avatar-studio-heading"><span>MEET THE PROTAGONIST</span><strong>MIRA VALE · THE GIRL BETWEEN ROOMS</strong><small>A curious young archivist with a field coat, travel satchel and a strange connection to the library.</small></div>
              <div className="ib-avatar-preview-wrap"><canvas ref={avatarPreviewRef} className="ib-avatar-preview" aria-label="Rotatable 3D preview of your customized traveller" /><span className="ib-avatar-preview-hint">DRAG TO ROTATE · LIVE PREVIEW</span></div>
              <label>Character style<select value={avatar.presentation} onChange={(e) => setAvatar((a) => ({ ...a, presentation: e.target.value as AvatarSettings["presentation"] }))}><option value="feminine">Feminine</option><option value="masculine">Masculine</option><option value="androgynous">Androgynous</option></select></label>
              <label>Skin tone<select value={avatar.skin} onChange={(e) => setAvatar((a) => ({ ...a, skin: e.target.value }))}>{SKIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Hair style<select value={avatar.hairStyle} onChange={(e) => setAvatar((a) => ({ ...a, hairStyle: e.target.value as AvatarSettings["hairStyle"] }))}><option value="short">Short</option><option value="long">Long</option><option value="tied">Tied back</option></select></label>
              <label>Hair colour<select value={avatar.hair} onChange={(e) => setAvatar((a) => ({ ...a, hair: e.target.value }))}>{HAIR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Outfit<select value={avatar.outfit} onChange={(e) => setAvatar((a) => ({ ...a, outfit: e.target.value }))}>{OUTFIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <button className="ib-avatar-reset" onClick={() => setAvatar(DEFAULT_AVATAR)}>RESTORE DEFAULT LOOK</button>
            </div>
            <button className="ib-primary" onClick={() => setStarted(true)}>ENTER THE LIBRARY <span>↗</span></button>
            <p className="ib-footnote">MIRA VALE · RIGGED CHARACTER · CHAPTER 01 · THE SILENT LIBRARY</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={gameShellRef} className="ib-page ib-game-page">
      <header className="ib-game-header">
        <div><p className="ib-kicker">MIUMI ORIGINAL · CHAPTER 01</p><h1>THE IN-BETWEEN</h1></div>
        <div className="ib-chapter-label"><span /> THE SILENT LIBRARY</div>
        <div className="ib-game-actions">
          <button className="ib-quiet-button ib-fullscreen-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}>{isFullscreen ? "EXIT FULL SCREEN" : "FULL SCREEN ⛶"}</button>
          <button className="ib-quiet-button" onClick={reset}>RESET STORY</button>
        </div>
      </header>
      <div className="ib-game-layout">
        <div className="ib-world">
          <canvas ref={canvasRef} aria-label="Third-person 3D view of the Silent Library" />
          <div className="ib-world-top"><span>✦ THE SILENT LIBRARY</span><span>CHAPTER 01 / 04</span></div>
          <div className="ib-world-bottom"><span>W A S D TO MOVE · MOVE MOUSE TO LOOK</span><span>CLICK WORLD TO CAPTURE MOUSE · E TO INTERACT · ESC TO RELEASE</span></div>
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
          <div className="ib-side-section"><p className="ib-side-label">YOUR OBJECTIVE</p><h2>{doorOpen ? "Beyond the first door" : clockSolved ? "Find the hidden key" : "Find a way out"}</h2><p>{doorOpen ? "The hidden archive is open. Follow the records and discover why Mira's handwriting appears in the future." : clockSolved ? "The clock answered the letter. Search behind the painting for the key." : "Explore carefully. Read the letter, inspect the room and work out why the clock stopped at 11:17."}</p></div>
          <div className="ib-side-section"><p className="ib-side-label">JOURNAL</p><div className="ib-journal-item"><span>01</span><div><strong>The clock</strong><small>{clockSolved ? "It moved at 11:17" : "Stopped at an unknown time"}</small></div></div><div className="ib-journal-item"><span>02</span><div><strong>The locked door</strong><small>{doorOpen ? "Opened into the archive" : "A key is missing"}</small></div></div>{inventory.includes("Old photograph") && <div className="ib-journal-item"><span>03</span><div><strong>The impossible photograph</strong><small>A fourth shadow in a three-person portrait</small></div></div>}{inventory.includes("Archive ledger") && <div className="ib-journal-item"><span>04</span><div><strong>The missing room</strong><small>The Forgotten Garden is listed in the ledger</small></div></div>}</div>
          <div className="ib-side-section"><p className="ib-side-label">INVENTORY</p>{inventory.length ? inventory.map((item) => <div className="ib-inventory-item" key={item}><span>◇</span>{item}</div>) : <p className="ib-empty">Nothing collected yet.</p>}</div>
          <div className="ib-side-note">“The rooms remember what the people forget.”</div>
        </aside>
      </div>
      <div className="ib-game-footer"><span>Autosave enabled</span><span>Best experienced with headphones</span><span>© MIUMI · THE IN-BETWEEN</span></div>
      {message && <div className="ib-modal-backdrop" role="presentation" onClick={() => setMessage(null)}><div className="ib-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><p className="ib-kicker">A DISCOVERY</p><h2>{message.title}</h2><p>{message.body}</p><button className="ib-primary" onClick={() => setMessage(null)}>CONTINUE <span>↗</span></button></div></div>}
    </section>
  );
}
