import { Component, ElementRef, OnInit, OnDestroy, ViewChild, NgZone, inject } from "@angular/core";
import * as THREE from "three";

@Component({
  selector: "app-background",
  standalone: true,
  template: `
    <div class="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none bg-slate-100 bg-cover bg-center bg-no-repeat" style="background-image: url('/assets/media/background.webp');">
      <div #rendererContainer class="absolute inset-0"></div>
    </div>
  `,
  styles: [],
})
export class BackgroundComponent implements OnInit, OnDestroy {
  @ViewChild("rendererContainer", { static: true }) rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private bubbles: THREE.Mesh[] = [];
  private animationId: number | null = null;
  private ngZone = inject(NgZone);
  private clock = new THREE.Clock();

  ngOnInit() {
    this.initThree();
    this.animate();
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    // Cleanup Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.bubbles.forEach((bubble) => {
      bubble.geometry.dispose();
      (bubble.material as THREE.Material).dispose();
    });
  }

  private initThree() {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    this.camera.position.z = 500;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    // Create floating bubbles
    this.createBubbles();

    // Add soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional lights for depth
    const blueLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    blueLight.position.set(-100, 100, 100);
    this.scene.add(blueLight);

    const pinkLight = new THREE.DirectionalLight(0xf472b6, 0.8);
    pinkLight.position.set(100, -100, 100);
    this.scene.add(pinkLight);
  }

  private createBubbles() {
    const bubbleCount = 40;
    const colors = [
      0x3b82f6, // blue-500
      0x60a5fa, // blue-400
      0x93c5fd, // blue-300
      0xec4899, // pink-500
      0xf472b6, // pink-400
      0xf9a8d4, // pink-300
    ];

    for (let i = 0; i < bubbleCount; i++) {
      const radius = Math.random() * 20 + 10;
      const geometry = new THREE.SphereGeometry(radius, 32, 32);

      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        transparent: true,
        opacity: 0.4 + Math.random() * 0.3,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      const bubble = new THREE.Mesh(geometry, material);

      // Random position
      bubble.position.x = (Math.random() - 0.5) * 1200;
      bubble.position.y = (Math.random() - 0.5) * 800;
      bubble.position.z = (Math.random() - 0.5) * 400;

      // Store animation properties
      (bubble as any).velocity = {
        x: (Math.random() - 0.5) * 0.5,
        y: Math.random() * 0.3 + 0.2,
        z: (Math.random() - 0.5) * 0.3,
      };
      (bubble as any).rotationSpeed = {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
      };
      (bubble as any).floatOffset = Math.random() * Math.PI * 2;
      (bubble as any).floatSpeed = 0.5 + Math.random() * 0.5;

      this.scene.add(bubble);
      this.bubbles.push(bubble);
    }
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);
        this.render();
      };
      loop();
    });
  }

  private render() {
    const elapsed = this.clock.getElapsedTime();

    this.bubbles.forEach((bubble) => {
      const velocity = (bubble as any).velocity;
      const rotationSpeed = (bubble as any).rotationSpeed;
      const floatOffset = (bubble as any).floatOffset;
      const floatSpeed = (bubble as any).floatSpeed;

      // Gentle floating motion
      bubble.position.x += velocity.x;
      bubble.position.y += velocity.y;
      bubble.position.z += velocity.z;

      // Add sinusoidal movement for organic feel
      bubble.position.x += Math.sin(elapsed * floatSpeed + floatOffset) * 0.3;

      // Gentle rotation
      bubble.rotation.x += rotationSpeed.x;
      bubble.rotation.y += rotationSpeed.y;

      // Reset position if bubble goes too far
      if (bubble.position.y > 500) {
        bubble.position.y = -500;
        bubble.position.x = (Math.random() - 0.5) * 1200;
      }
      if (bubble.position.x > 700) bubble.position.x = -700;
      if (bubble.position.x < -700) bubble.position.x = 700;
    });

    // Subtle camera movement
    this.camera.position.x = Math.sin(elapsed * 0.1) * 20;
    this.camera.position.y = Math.cos(elapsed * 0.1) * 10;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
