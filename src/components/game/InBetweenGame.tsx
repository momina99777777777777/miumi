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
  presentation: "androgynous",
  skin: "#bd896d",
  hair: "#241b18",
  hairStyle: "long",
  outfit: "#283746",
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
        if (data.avatar) setAvatar({ ...DEFAULT_AVATAR, ...data.avatar });
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
        const character = new THREE.Group();
        character.position.y = 0.11;
        scene.add(character);
        const material = (color: string, roughness = 0.8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
        const skin = material(avatar.skin);
        const hair = material(avatar.hair);
        const outfit = material(avatar.outfit);
        const shadowOutfit = material(new THREE.Color(avatar.outfit).multiplyScalar(0.68).getStyle());
        const boots = material("#171719");
        const brass = material("#b49a72", 0.4, 0.45);
        const part = (geometry: any, mat: any, x: number, y: number, z: number, parent: any = character) => {
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
        part(new THREE.TorusGeometry(0.19, 0.025, 8, 24), brass, 0, 1.47, 0).rotation.x = Math.PI / 2;
        part(new THREE.SphereGeometry(0.235, 28, 22), skin, 0, 1.82, 0);
        part(new THREE.SphereGeometry(0.245, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.57), hair, 0, 1.88, 0);
        const hairMotion: any[] = [];
        if (avatar.hairStyle === "long") {
          for (const side of [-1, 1]) {
            const lock = new THREE.Group();
            lock.position.set(side * 0.19, 1.72, 0.045);
            character.add(lock);
            part(new THREE.CapsuleGeometry(0.105, 0.42, 5, 12), hair, 0, -0.15, 0, lock);
            hairMotion.push({ pivot: lock, side });
          }
        } else if (avatar.hairStyle === "tied") {
          part(new THREE.SphereGeometry(0.12, 16, 12), hair, 0, 1.72, 0.22);
          const ponytail = new THREE.Group();
          ponytail.position.set(0, 1.62, 0.2);
          character.add(ponytail);
          part(new THREE.CapsuleGeometry(0.07, 0.22, 5, 10), hair, 0, -0.12, 0, ponytail);
          hairMotion.push({ pivot: ponytail, side: 0.7 });
        } else {
          part(new THREE.SphereGeometry(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hair, 0, 1.94, 0.015);
        }
        const eye = material("#241e1b", 0.45);
        part(new THREE.SphereGeometry(0.022, 10, 8), eye, -0.075, 1.83, -0.218);
        part(new THREE.SphereGeometry(0.022, 10, 8), eye, 0.075, 1.83, -0.218);
        // Face shaping: brows, nose bridge, ears and a subtle mouth make the
        // traveller read as a person from close-up and three-quarter angles.
        const eyeWhite = material("#e6ded0", 0.5);
        const brow = material(new THREE.Color(avatar.hair).multiplyScalar(0.72).getStyle());
        for (const x of [-0.075, 0.075]) {
          part(new THREE.SphereGeometry(0.031, 12, 10), eyeWhite, x, 1.835, -0.205);
          part(new THREE.SphereGeometry(0.013, 10, 8), eye, x, 1.833, -0.232);
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
        character.add(scarfPivot);
        const scarf = part(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), seam, 0, -0.06, -0.07, scarfPivot);
        scarf.rotation.z = 0.12;
        const coatTail = new THREE.Group();
        coatTail.position.set(0, 0.9, 0.13);
        character.add(coatTail);
        part(new THREE.BoxGeometry(0.43, 0.38, 0.075), shadowOutfit, 0, -0.18, 0, coatTail);
        part(new THREE.BoxGeometry(0.11, 0.28, 0.035), seam, 0.13, 1.28, -0.27);
        const limb = (x: number, y: number, length: number, width: number, mat: any) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, y, 0);
          character.add(pivot);
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
          limbs[0].rotation.x = Math.sin(elapsed * 1.2) * 0.025;
          limbs[1].rotation.x = -Math.sin(elapsed * 1.2) * 0.025;
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
        const paintingArt = makeBox(1.35, 1.05, 0.05, mat("#172b2a"), -3.9, 3.35, -10.62);
        // Pillars and a warm hanging light give the room depth.
        for (const x of [-4.7, 4.7]) makeBox(0.42, 5.5, 0.42, mat("#393434"), x, 2.65, -8.9);
        const lamp = new THREE.PointLight("#f2bd7b", 24, 9, 2);
        lamp.position.set(0, 4.8, -1.5);
        scene.add(lamp);
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.55, 24, 1, true), brass);
        lampShade.position.set(0, 4.7, -1.5);
        scene.add(lampShade);

        // Build the player's customised human character from reusable 3D parts.
        // This keeps appearance choices local and avoids a generic sample character.
        const player = new THREE.Group();
        scene.add(player);
        player.position.set(0, 0, 4.8);
        const skinMat = mat(avatar.skin, 0.78);
        const hairMat = mat(avatar.hair, 0.9);
        const outfitMat = mat(avatar.outfit, 0.88);
        const darkOutfitMat = mat(new THREE.Color(avatar.outfit).multiplyScalar(0.72).getStyle(), 0.9);
        const bootMat = mat("#171719", 0.7);
        const trimMat = mat("#b49a72", 0.48, 0.35);
        const makePart = (geometry: any, material: any, x: number, y: number, z: number, parent: any = player) => {
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
        makePart(new THREE.TorusGeometry(0.19, 0.025, 8, 24), trimMat, 0, 1.47, 0).rotation.x = Math.PI / 2;
        makePart(new THREE.SphereGeometry(0.235, 28, 22), skinMat, 0, 1.82, 0);
        const facePlate = makePart(new THREE.SphereGeometry(0.19, 24, 18, 0, Math.PI, 0.15, Math.PI * 0.7), skinMat, 0, 1.81, -0.035);
        facePlate.scale.set(0.98, 0.98, 0.9);
        // Hair cap plus selectable silhouette.
        makePart(new THREE.SphereGeometry(0.245, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.57), hairMat, 0, 1.88, 0);
        const hairMotion: any[] = [];
        if (avatar.hairStyle === "long") {
          for (const side of [-1, 1]) {
            const lock = new THREE.Group();
            lock.position.set(side * 0.19, 1.72, 0.045);
            player.add(lock);
            makePart(new THREE.CapsuleGeometry(0.105, 0.42, 5, 12), hairMat, 0, -0.15, 0, lock);
            hairMotion.push({ pivot: lock, side });
          }
        } else if (avatar.hairStyle === "tied") {
          makePart(new THREE.SphereGeometry(0.12, 16, 12), hairMat, 0, 1.72, 0.22);
          const ponytail = new THREE.Group();
          ponytail.position.set(0, 1.62, 0.2);
          player.add(ponytail);
          makePart(new THREE.CapsuleGeometry(0.07, 0.22, 5, 10), hairMat, 0, -0.12, 0, ponytail);
          hairMotion.push({ pivot: ponytail, side: 0.7 });
        } else {
          makePart(new THREE.SphereGeometry(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), hairMat, 0, 1.94, 0.015);
        }
        // Small facial details face toward the camera/front of the character.
        const eyeMat = mat("#241e1b", 0.45);
        makePart(new THREE.SphereGeometry(0.022, 10, 8), eyeMat, -0.075, 1.83, -0.218);
        makePart(new THREE.SphereGeometry(0.022, 10, 8), eyeMat, 0.075, 1.83, -0.218);
        const eyeWhiteMat = mat("#e6ded0", 0.5);
        const browMat = mat(new THREE.Color(avatar.hair).multiplyScalar(0.72).getStyle());
        for (const x of [-0.075, 0.075]) {
          makePart(new THREE.SphereGeometry(0.031, 12, 10), eyeWhiteMat, x, 1.835, -0.205);
          makePart(new THREE.SphereGeometry(0.013, 10, 8), eyeMat, x, 1.833, -0.232);
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
        player.add(scarfPivot);
        const scarf = makePart(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), stitchMat, 0, -0.06, -0.07, scarfPivot);
        scarf.rotation.z = 0.12;
        const coatTail = new THREE.Group();
        coatTail.position.set(0, 0.9, 0.13);
        player.add(coatTail);
        makePart(new THREE.BoxGeometry(0.43, 0.38, 0.075), darkOutfitMat, 0, -0.18, 0, coatTail);
        makePart(new THREE.BoxGeometry(0.11, 0.28, 0.035), stitchMat, 0.13, 1.28, -0.27);
        const limb = (x: number, y: number, length: number, width: number, material: any) => {
          const pivot = new THREE.Group();
          pivot.position.set(x, y, 0);
          player.add(pivot);
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
        const onTouchStart = (event: PointerEvent) => { if (event.pointerType === "touch") { touchLookActive = true; lastTouchX = event.clientX; lastTouchY = event.clientY; } };
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
            const forwardVector = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
            const rightVector = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
            const direction = forwardVector.multiplyScalar(forward).add(rightVector.multiplyScalar(sideways)).normalize();
            const step = delta * 3.2;
            const blockers = [
              { x: 0, z: -2.2, hx: 1.82, hz: 1.12 },
              { x: -4.7, z: -8.9, hx: 0.48, hz: 0.48 },
              { x: 4.7, z: -8.9, hx: 0.48, hz: 0.48 },
              { x: -3.9, z: -10.1, hx: 0.72, hz: 0.35 },
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
            // Gentle counter-sway and vertical foot rhythm keep the gait from
            // looking like a rigid sliding mannequin.
            player.position.y = moving ? Math.abs(Math.sin(clockTimer.elapsedTime * 9)) * 0.045 : Math.sin(clockTimer.elapsedTime * 1.7) * 0.012;
            player.rotation.z = moving ? Math.sin(clockTimer.elapsedTime * 4.5) * 0.018 : 0;
          }
          const promptNear = (x: number, z: number, radius: number) => Math.hypot(player.position.x - x, player.position.z - z) < radius;
          const doorNear = promptNear(0, -9.2, 2.5);
          const prompt = promptNear(-0.55, -2.1, 2.1) ? "E  ·  READ THE LETTER" : promptNear(2.8, -9.8, 2.4) ? "E  ·  EXAMINE THE CLOCK" : promptNear(-3.9, -9.2, 2.2) ? "E  ·  INSPECT THE PAINTING" : doorNear ? (unlocked ? "E  ·  OPEN / CLOSE DOOR" : "E  ·  TRY THE DOOR") : "";
          if (prompt !== lastPrompt) { lastPrompt = prompt; window.dispatchEvent(new CustomEvent("inbetween:prompt", { detail: prompt })); }
          target.set(player.position.x, 1.15, player.position.z);
          const horizontalDistance = Math.cos(cameraPitch) * 6.2;
          const desired = new THREE.Vector3(player.position.x + Math.sin(cameraYaw)*horizontalDistance, 3.1 + Math.sin(cameraPitch)*6.2, player.position.z + Math.cos(cameraYaw)*horizontalDistance);
          camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
          camera.lookAt(target);
          doorPivot.rotation.y = THREE.MathUtils.lerp(doorPivot.rotation.y, doorIsOpen ? -1.42 : 0, delta * 2.2);
          if (unlocked && !enteredArchive && player.position.z < -12.2) {
            enteredArchive = true;
            setTimeout(() => setMessage({ title:"The hidden archive", body:"The library was only the first room. Shelves of forgotten records stretch into the dark. Somewhere in here, another door is waiting." }), 250);
          }
          if (clockActivated) hand.rotation.z = THREE.MathUtils.lerp(hand.rotation.z, -2.4, delta * 0.9);
          if (clockActivated) {
            painting.position.x = THREE.MathUtils.lerp(painting.position.x, -4.75, delta * 1.4);
            paintingArt.position.x = THREE.MathUtils.lerp(paintingArt.position.x, -4.75, delta * 1.4);
          }
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
            <div className="ib-avatar-studio">
              <div className="ib-avatar-studio-heading"><span>BEFORE THE STORY</span><strong>CREATE YOUR TRAVELLER</strong></div>
              <div className="ib-avatar-preview-wrap"><canvas ref={avatarPreviewRef} className="ib-avatar-preview" aria-label="Rotatable 3D preview of your customized traveller" /><span className="ib-avatar-preview-hint">DRAG TO ROTATE · LIVE PREVIEW</span></div>
              <label>Character style<select value={avatar.presentation} onChange={(e) => setAvatar((a) => ({ ...a, presentation: e.target.value as AvatarSettings["presentation"] }))}><option value="feminine">Feminine</option><option value="masculine">Masculine</option><option value="androgynous">Androgynous</option></select></label>
              <label>Skin tone<select value={avatar.skin} onChange={(e) => setAvatar((a) => ({ ...a, skin: e.target.value }))}>{SKIN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Hair style<select value={avatar.hairStyle} onChange={(e) => setAvatar((a) => ({ ...a, hairStyle: e.target.value as AvatarSettings["hairStyle"] }))}><option value="short">Short</option><option value="long">Long</option><option value="tied">Tied back</option></select></label>
              <label>Hair colour<select value={avatar.hair} onChange={(e) => setAvatar((a) => ({ ...a, hair: e.target.value }))}>{HAIR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <label>Outfit<select value={avatar.outfit} onChange={(e) => setAvatar((a) => ({ ...a, outfit: e.target.value }))}>{OUTFIT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
              <button className="ib-avatar-reset" onClick={() => setAvatar(DEFAULT_AVATAR)}>RESTORE DEFAULT LOOK</button>
            </div>
            <button className="ib-primary" onClick={() => setStarted(true)}>ENTER THE LIBRARY <span>↗</span></button>
            <p className="ib-footnote">YOUR LOOK IS SAVED · CHAPTER 01 · THE SILENT LIBRARY</p>
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
