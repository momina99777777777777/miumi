import { useEffect, useRef } from "react";

type Props = { speaking: boolean };

export default function QuietRoomAvatar({ speaking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speakingRef = useRef(speaking);
  useEffect(() => { speakingRef.current = speaking; }, [speaking]);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let renderer: any;
    let observer: ResizeObserver | undefined;
    let cleanup: (() => void) | undefined;

    const build = async () => {
      try {
        const THREE = await import(/* @vite-ignore */ "https://esm.sh/three@0.180.0") as any;
        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#f4e8eb");
        scene.fog = new THREE.Fog("#f4e8eb", 10, 24);
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
        camera.position.set(0, 2.75, 8.8);
        camera.lookAt(0, 1.45, 0);

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;

        scene.add(new THREE.HemisphereLight("#fff3f5", "#a8898f", 2.2));
        const key = new THREE.DirectionalLight("#fff1dc", 3.1);
        key.position.set(-3.5, 7, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        scene.add(key);
        const fill = new THREE.PointLight("#e9b9d0", 32, 12);
        fill.position.set(3, 3.4, 2);
        scene.add(fill);
        const windowGlow = new THREE.PointLight("#c5d9ed", 18, 9);
        windowGlow.position.set(-3, 3.1, -1);
        scene.add(windowGlow);

        const mat = (color: string, roughness = 0.78, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
        const addMesh = (geometry: any, material: any, parent: any, x: number, y: number, z: number, cast = true) => {
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(x, y, z);
          mesh.castShadow = cast;
          mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        const box = (parent: any, color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, radius = 0.08) => {
          const geometry = new THREE.BoxGeometry(sx, sy, sz);
          const mesh = addMesh(geometry, mat(color), parent, x, y, z);
          return mesh;
        };
        const sphere = (parent: any, color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
          const mesh = addMesh(new THREE.SphereGeometry(1, 24, 18), mat(color), parent, x, y, z);
          mesh.scale.set(sx, sy, sz);
          return mesh;
        };

        // Floor, soft rug and the window wall.
        box(scene, "#ead8d9", 0, -0.18, -0.2, 14, 0.28, 11);
        const rug = addMesh(new THREE.CylinderGeometry(3.5, 3.5, 0.035, 64), mat("#e8cbd6"), scene, 0, -0.015, 1.05, false);
        rug.scale.set(1.15, 1, 0.65);
        box(scene, "#f7e9e8", 0, 3.15, -3.1, 13, 6.4, 0.22);
        box(scene, "#fff8f1", -2.7, 3.35, -2.94, 2.75, 2.25, 0.08);
        box(scene, "#c6d9e4", -2.7, 3.35, -2.88, 2.55, 2.05, 0.035);
        box(scene, "#fff8f1", -2.7, 3.35, -2.78, 0.075, 2.3, 0.12);
        box(scene, "#fff8f1", -2.7, 3.35, -2.76, 2.8, 0.075, 0.12);
        box(scene, "#fff8f1", -2.7, 3.35, -2.7, 0.07, 2.2, 0.12);
        box(scene, "#fff8f1", -2.7, 3.35, -2.69, 2.7, 0.07, 0.12);
        // Sofa, cushions and legs.
        const sofa = new THREE.Group(); scene.add(sofa);
        box(sofa, "#b77e9c", 0, 0.72, -0.5, 4.9, 1.2, 1.05);
        box(sofa, "#d39ab2", 0, 1.35, -0.92, 4.7, 1.18, 0.48);
        box(sofa, "#e6b9ca", 0, 0.55, 0.02, 4.75, 0.35, 1.2);
        box(sofa, "#c98eaa", -2.25, 1.0, -0.1, 0.48, 1.05, 1.15);
        box(sofa, "#c98eaa", 2.25, 1.0, -0.1, 0.48, 1.05, 1.15);
        box(sofa, "#edc8d4", -1.3, 1.15, -0.58, 0.9, 0.7, 0.25);
        box(sofa, "#d9b5cb", 1.35, 1.15, -0.58, 0.9, 0.7, 0.25);
        for (const x of [-1.85, 1.85]) for (const z of [-0.05, -0.85]) box(sofa, "#896b72", x, 0.12, z, 0.12, 0.38, 0.12);

        // Companion: a fully 3D stylised person, seated with bent legs.
        const person = new THREE.Group(); scene.add(person);
        const skin = mat("#e8b9a5");
        const hair = mat("#62414c");
        const outfit = mat("#a66f91");
        const trim = mat("#f0d5df");
        const limb = (parent: any, material: any, a: any, b: any, radius: number) => {
          const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
          const delta = new THREE.Vector3().subVectors(end, start);
          const mesh = addMesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 16), material, parent, (a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2);
          mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
          sphere(parent, material.color.getStyle(), a[0], a[1], a[2], radius, radius, radius);
          sphere(parent, material.color.getStyle(), b[0], b[1], b[2], radius, radius, radius);
          return mesh;
        };
        // Torso and neck.
        const torso = sphere(person, "#a66f91", 0, 1.72, 0.02, 0.69, 0.78, 0.42);
        torso.rotation.x = -0.08;
        limb(person, skin, [0,2.27,0.02], [0,2.48,0.02], 0.16);
        // Head, ears, hair cap and long side locks.
        const head = new THREE.Group(); person.add(head); head.position.set(0,2.86,0.03);
        sphere(head, "#e8b9a5", 0, 0, 0, 0.48, 0.57, 0.43);
        sphere(head, "#62414c", 0, 0.36, -0.015, 0.5, 0.29, 0.45);
        sphere(head, "#62414c", -0.43, -0.13, -0.02, 0.14, 0.5, 0.25);
        sphere(head, "#62414c", 0.43, -0.13, -0.02, 0.14, 0.5, 0.25);
        sphere(head, "#e8b9a5", -0.48, -0.04, 0.02, 0.09, 0.13, 0.1);
        sphere(head, "#e8b9a5", 0.48, -0.04, 0.02, 0.09, 0.13, 0.1);
        // Face details are on the camera-facing side (+Z).
        sphere(head, "#513c43", -0.16, 0.03, 0.39, 0.035, 0.055, 0.025);
        sphere(head, "#513c43", 0.16, 0.03, 0.39, 0.035, 0.055, 0.025);
        const mouth = sphere(head, "#a65f70", 0, -0.19, 0.407, 0.055, 0.018, 0.018);
        sphere(head, "#f4d4c8", 0, -0.09, 0.4, 0.035, 0.025, 0.018);
        // Arms rest across lap.
        limb(person, skin, [-0.55,2.05,0.02], [-0.68,1.56,0.47], 0.13);
        limb(person, skin, [0.55,2.05,0.02], [0.68,1.56,0.47], 0.13);
        limb(person, outfit, [-0.58,1.98,0.01], [-0.4,1.48,0.37], 0.19);
        limb(person, outfit, [0.58,1.98,0.01], [0.4,1.48,0.37], 0.19);
        sphere(person, "#e8b9a5", -0.4,1.46,0.39,0.12,0.11,0.13);
        sphere(person, "#e8b9a5", 0.4,1.46,0.39,0.12,0.11,0.13);
        // Seated thighs and lower legs.
        limb(person, outfit, [-0.36,1.35,0.08], [-0.55,0.78,0.72], 0.24);
        limb(person, outfit, [0.36,1.35,0.08], [0.55,0.78,0.72], 0.24);
        limb(person, outfit, [-0.55,0.78,0.72], [-0.55,0.24,0.72], 0.17);
        limb(person, outfit, [0.55,0.78,0.72], [0.55,0.24,0.72], 0.17);
        sphere(person, "#5b4653", -0.55,0.18,0.91,0.22,0.12,0.34);
        sphere(person, "#5b4653", 0.55,0.18,0.91,0.22,0.12,0.34);
        // Decorative collar and a tiny pendant.
        const collar = addMesh(new THREE.TorusGeometry(0.3,0.035,8,32), trim, person, 0,2.28,0.36);
        collar.rotation.x = 0.3;
        sphere(person, "#e6c58c", 0,2.18,0.43,0.055,0.075,0.035);

        // A leafy plant and a small lamp give the room depth.
        const pot = addMesh(new THREE.CylinderGeometry(0.24,0.3,0.42,24), mat("#d7a9b8"), scene, -3.05,0.22,0.45);
        limb(scene, mat("#6f8c79"), [-3.05,0.4,0.45], [-3.05,1.45,0.45], 0.035);
        for (let i=0;i<7;i++) {
          const angle=i*Math.PI*2/7;
          const leaf=sphere(scene,"#789681",-3.05+Math.cos(angle)*0.34,1.12+Math.sin(i*2)*0.24,0.45+Math.sin(angle)*0.15,0.12,0.38,0.07);
          leaf.rotation.z=-Math.cos(angle)*0.65;
        }
        const lampBase=addMesh(new THREE.CylinderGeometry(0.2,0.25,0.12,24),mat("#c69a77"),scene,3.1,0.1,-0.15);
        limb(scene,mat("#b18b78"),[3.1,0.18,-0.15],[3.1,1.45,-0.15],0.045);
        const shade=addMesh(new THREE.ConeGeometry(0.42,0.55,32,1,true),mat("#f4d8b7"),scene,3.1,1.65,-0.15);
        const warm=new THREE.PointLight("#ffd9a8",14,5); warm.position.set(3.1,1.55,0.2);scene.add(warm);
        // Side table and tea cup.
        box(scene,"#bd8d9b",2.65,0.48,1.05,0.85,0.12,0.65);
        box(scene,"#9c7180",2.65,0.22,1.05,0.12,0.42,0.12);
        addMesh(new THREE.CylinderGeometry(0.12,0.1,0.13,20),mat("#fff5ed"),scene,2.55,0.62,1.05);
        // Small floating dust motes in the window light.
        const motes = new THREE.Group(); scene.add(motes);
        for(let i=0;i<24;i++){
          const mote=addMesh(new THREE.SphereGeometry(0.018,8,8),new THREE.MeshBasicMaterial({color:"#fff7e8",transparent:true,opacity:0.65}),motes, -3+Math.random()*6,0.8+Math.random()*3,-0.8+Math.random()*1.5,false);
          mote.userData.offset=Math.random()*Math.PI*2;
        }

        const clock = new THREE.Clock();
        const resize = () => {
          if (!canvas.clientWidth || !canvas.clientHeight) return;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        };
        observer = new ResizeObserver(resize);
        observer.observe(canvas);
        resize();
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const animate = () => {
          frame = requestAnimationFrame(animate);
          const t=clock.getElapsedTime();
          if (!reduced) {
            person.position.y = Math.sin(t*1.25)*0.025;
            person.rotation.y = Math.sin(t*0.42)*0.035;
            head.rotation.y = Math.sin(t*0.55)*0.035;
            head.rotation.x = Math.sin(t*0.8)*0.018;
            mouth.scale.y = speakingRef.current ? 0.09 + Math.abs(Math.sin(t*11))*0.08 : 0.018;
            motes.children.forEach((m: any) => { m.position.y += Math.sin(t*0.5+m.userData.offset)*0.0008; });
          }
          renderer.render(scene,camera);
        };
        animate();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer?.disconnect();
          scene.traverse((obj: any) => {
            obj.geometry?.dispose?.();
            if (Array.isArray(obj.material)) obj.material.forEach((m:any)=>m.dispose?.());
            else obj.material?.dispose?.();
          });
          renderer.dispose();
        };
      } catch {
        if (!cancelled) {
          const context = canvasRef.current?.getContext("2d");
          if (context && canvasRef.current) {
            context.fillStyle = "#f4e8eb"; context.fillRect(0,0,canvasRef.current.width,canvasRef.current.height);
            context.fillStyle = "#77586b"; context.font = "16px sans-serif"; context.textAlign = "center";
            context.fillText("Your quiet space", canvasRef.current.width/2, canvasRef.current.height/2);
          }
        }
      }
    };
    build();
    return () => { cancelled=true; cleanup?.(); if (renderer) renderer.dispose(); cancelAnimationFrame(frame); observer?.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="quiet-3d-canvas" aria-label="Three-dimensional animated companion seated on a sofa in a peaceful room" />;
}
