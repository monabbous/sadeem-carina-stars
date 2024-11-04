/**
 * This is the main file of the project.
 * contains the three js code to implement with Three.js a galaxy type of particles where each particle is a student at carina 
 * the scene should be cinematic and the camera should be moving around the center of the scene
 */

import gsap from 'gsap';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { AfterimagePass, OutputPass, RenderPass, ShaderPass } from 'three/examples/jsm/Addons.js';


// add eruda for debugging
// if (import.meta.env.MODE === 'development') {
// 	import('eruda').then(({ default: eruda }) => {
// 		eruda.init();
// 	});
// }
var debounce = (() => {
	const timers = new Map();
	return function (cb: Function, delay: number, key: string) {
		if (timers.has(key)) {
			clearTimeout(timers.get(key));
		}
		timers.set(key, setTimeout(() => {
			cb();
			timers.delete(key);
		}, delay));
	}
})()


const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(Infinity, Infinity);


const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight
}


const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true,
})

const composer = new EffectComposer(renderer);


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(30);


const distantLightIntensities = {
	far: 1,
	close: 0.5,
}

const ambientLightIntensities = {
	far: 0.2,
	close: 0.8,
}

const distantBehindLightIntensities = {
	far: 2,
	close: 0.5,
}

const distantBehindLight2Intensities = {
	far: 1,
	close: 0.5,
}

const distantLight = new THREE.DirectionalLight(0xe4dcf2, distantLightIntensities.far);
distantLight.position.set(0, 0.5, 1);
scene.add(distantLight);

const ambientLight = new THREE.AmbientLight(0xb69bd7, ambientLightIntensities.far);
scene.add(ambientLight);


const distantBehindLight = new THREE.DirectionalLight(0xb69bd7, distantBehindLightIntensities.far);
distantBehindLight.position.set(1, 0, -1);
scene.add(distantBehindLight);

const distantBehindLight2 = new THREE.DirectionalLight(0x9bb3d7, distantBehindLight2Intensities.far);
distantBehindLight2.position.set(1, 1, -1);
scene.add(distantBehindLight2);

let isAbout = window.location.hash?.slice(1) === 'about';

const centerObject = new THREE.Object3D();
scene.add(centerObject);

const logoContainer = new THREE.Group();
centerObject.add(logoContainer);


const beltsGroup = new THREE.Group();
beltsGroup.name = 'beltsGroup'
scene.add(beltsGroup)

const studentsLis = document.querySelectorAll<HTMLElement>('#students li');

const defaultCameraRadius = 8;
const aboutCameraRadius = 40


const getCameraRadius = () => {
	return isAbout ? aboutCameraRadius : defaultCameraRadius;
}

const cameraAngles = {
	horizontal: Math.PI / 3.5,
	vertical: Math.PI / 8,
	radius: defaultCameraRadius,
}

const target = new THREE.Vector3();
const currentCameraAngles = { ...cameraAngles };

const CAMERA_CHANGE_DURATION = 3;

const cameraDefaultTarget = new THREE.Vector3();
let cameraDefaultFov = 45;
camera.position.y = cameraDefaultTarget.y = Math.sin(cameraAngles.vertical) * getCameraRadius();
cameraDefaultTarget.x = getCameraRadius() * Math.cos(cameraAngles.horizontal);
cameraDefaultTarget.z = getCameraRadius() * Math.sin(cameraAngles.horizontal);


const AFTER_IMAGE_DAMP_ABOUT = 0.8;
const AFTER_IMAGE_DAMP_DEFAULT = 0;

const cameraAnglesMomentum = {
	horizontal: 0,
	vertical: 0
}

const aboutCameraHorizontalMomentum = 0.05;
const cameraMomentDuration = 5;


let cameraAnglesTween: gsap.core.Tween | undefined;
let cameraMomentTween: gsap.core.Tween | undefined;
let cameraFovTween: gsap.core.Tween | undefined;
function setCameraMomentum(horizontal: number, vertical: number, duration = cameraMomentDuration) {
	cameraMomentTween?.kill();
	cameraMomentTween = gsap.to(
		cameraAnglesMomentum,
		{
			horizontal,
			vertical,
			duration,
			ease: 'power3.out'
		}
	)
}

setCameraMomentum(
	isAbout ? aboutCameraHorizontalMomentum : 0,
	0
)

// gsap.to(
// 	cameraAnglesMomentum,
// 	{
// 		horizontal: isAbout ? 0.05 : 0,
// 		vertical: 0,
// 		duration: cameraMomentDuration,
// 	}
// )

camera.fov = cameraDefaultFov;
camera.updateProjectionMatrix();
// convert the getCameraRadius() and cameraAngle to x, y, z coordinates

const params = {
	threshold: 0.05,
	strength: 0.4,
	radius: 0.7,
	exposure: 0.4
};

const fxaaPass = new ShaderPass(FXAAShader);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);


for (let i = 0; i < 4; i++) {
	const belt = new THREE.Group();

	const beltContainer = new THREE.Group();
	beltContainer.add(belt);
	beltContainer.name = `belt-container-${i}`;
	beltsGroup.add(beltContainer);
};

const afterimagePass = new AfterimagePass(isAbout ? AFTER_IMAGE_DAMP_ABOUT : AFTER_IMAGE_DAMP_DEFAULT);
let afterImagePassTween: gsap.core.Tween | undefined;
function setup() {
	resize();

	composer.addPass(new RenderPass(scene, camera));

	const outputPass = new OutputPass();

	const fxaaPass = new ShaderPass(FXAAShader);
	const pixelRatio = renderer.getPixelRatio();
	fxaaPass.material.uniforms['resolution'].value.x = 1 / (sizes.width * pixelRatio);
	fxaaPass.material.uniforms['resolution'].value.y = 1 / (sizes.height * pixelRatio);
	// composer.addPass(fxaaPass);


	bloomPass.threshold = params.threshold;
	bloomPass.strength = params.strength;
	bloomPass.radius = params.radius;



	composer.addPass(bloomPass)
	composer.addPass(afterimagePass);



	composer.addPass(outputPass);

	renderer.setClearColor(0x000000, 0);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	logoContainer.rotation.z = Math.PI * 2;
	logoContainer.rotation.x = -Math.PI / 8 + Math.PI;
	logoContainer.rotation.y = Math.PI / 8;

	// 3 belts of particles surrounding the logo, and the particles are random shapes of objects



	gsap.to(logoContainer.rotation, {
		duration: 110,
		z: Math.PI * 2,
		repeat: -1,
		ease: 'none',
	})

	gsap.to(logoContainer.rotation, {
		duration: 30,
		x: Math.PI / 8 + Math.PI,
		repeat: -1,
		ease: 'sine.inOut',
		yoyo: true,
		yoyoEase: 'sine.inOut'
	})

	gsap.to(logoContainer.rotation, {
		duration: 50,
		y: -Math.PI / 4,
		repeat: -1,
		ease: 'sine.inOut',
		yoyo: true,
		yoyoEase: 'sine.inOut'
	})



	for (const beltContainer of beltsGroup.children) {
		const belt = beltContainer.children[0] as THREE.Group;
		gsap.to(belt.rotation, {
			duration: Math.random() * 60 + 240,
			y: Math.PI * 2,
			repeat: -1,
			ease: 'none',
		})
	}


}



/*
	Finding the most optimal horizontal angle

	best case scenarios:
	- current angle is 90, and target is 0-180, difference should be target - angle
	- current angle is 180, and target is 90-270, difference should be target - angle
	
	Need to accommodate:
	- current angle is 0, and target is 270, the difference is 270 to add and it should be -90, we subtracted 360
	- current angle is 270, and target is 0, the difference is -270 to add and it should be 90, we added 360

	- current angle is 0, and target is 315, the difference is 315 to add and it should be -45, we subtracted 360
	- current angle is 315, and target is 0, the difference is -315 to add and it should be 45, we added 360

	- current angle is 315, and target is 45 the difference is -270 to add and it should be 90
	- current angle is 45, and target is 315 the difference is 270 to add and it should be -90


	- current angle is 270, and target is 0, the difference is -270 to add and it should be 90, we added 360 to the difference and then added to current angle

	so the conclusion if the difference is more than 180, either subtract or add 180

*/
function setCameraAngles(
	horizontal = cameraAngles.horizontal,
	vertical = cameraAngles.vertical,
	radius = getCameraRadius(),
	containVertical = !selectedObject,
	mostOptimalPath = false,
) {
	// cameraAngles.horizontal = horizontal % (Math.PI * 2);

	cameraAngles.horizontal = horizontal;

	if (mostOptimalPath) {
		let _horizontal = horizontal % (Math.PI * 2);
		if (_horizontal < 0) {
			_horizontal = Math.PI * 2 + _horizontal;
		}
		let currentHorizontal = currentCameraAngles.horizontal % (Math.PI * 2);

		if (currentHorizontal < 0) {
			currentHorizontal = Math.PI * 2 + currentHorizontal;
		}

		const dH = _horizontal - currentHorizontal;

		if (Math.abs(dH) > Math.PI) {
			const direction = dH / Math.abs(dH) * -1;
			cameraAngles.horizontal = currentCameraAngles.horizontal + dH + Math.PI * 2 * direction
		} else {
			cameraAngles.horizontal = currentCameraAngles.horizontal + dH
		}
	}


	cameraAngles.vertical = (containVertical ? Math.min(Math.PI / 6, Math.max(-Math.PI / 6, vertical)) : vertical) % (Math.PI * 2);
	cameraAngles.radius = radius;
}

function polarToCartesian(
	object: { x: number, y: number, z: number },
	horizontal: number,
	vertical: number,
	radius: number,
) {
	object.x = radius * Math.cos(horizontal) * Math.cos(vertical);
	object.y = radius * Math.sin(vertical);
	object.z = radius * Math.sin(horizontal) * Math.cos(vertical);

	return object;
	// return {
	// 	y: Math.sin(vertical) * radius,
	// 	x: radius * Math.cos(horizontal),
	// 	z: radius * Math.sin(horizontal),
	// }
}

// const targetAngle = new THREE.Vector3();

function animate() {

	if (!selectedObject) {


		if (cameraAnglesMomentum.horizontal || cameraAnglesMomentum.vertical) {
			setCameraAngles(
				cameraAngles.horizontal + (isPointerDown ? 0 : cameraAnglesMomentum.horizontal),
				cameraAngles.vertical + (isPointerDown ? 0 : cameraAnglesMomentum.vertical),
			)
		}

		cameraDefaultFov = 45;
	} else if (selectedObject) {
		cameraDefaultFov = 15;
	}

	if (!selectedObject && (isPointerDown || cameraMomentTween?.isActive())) {
		cameraAnglesTween?.kill();
		currentCameraAngles.horizontal = cameraAngles.horizontal;
		currentCameraAngles.vertical = cameraAngles.vertical;

		cameraAnglesTween = gsap.to(
			currentCameraAngles, {
			radius: cameraAngles.radius,
			duration: CAMERA_CHANGE_DURATION,
			ease: selectedObject && !isAbout ? 'power3.inOut' : undefined,
		})
	} else {

		if (
			cameraAnglesTween?.vars.horizontal !== cameraAngles.horizontal
			|| cameraAnglesTween?.vars.vertical !== cameraAngles.vertical
			|| cameraAnglesTween?.vars.radius !== cameraAngles.radius
		) {
			cameraAnglesTween?.kill();
			cameraAnglesTween = gsap.to(
				currentCameraAngles, {
				...cameraAngles,
				duration: isPointerDown ? 0.1 : CAMERA_CHANGE_DURATION,
				ease: selectedObject && !isAbout ? 'power3.inOut' : undefined,
			})
		}
	}


	polarToCartesian(
		camera.position,
		currentCameraAngles.horizontal,
		currentCameraAngles.vertical,
		currentCameraAngles.radius,
	)

	if (cameraFovTween?.vars.fov !== cameraDefaultFov) {
		cameraFovTween?.kill();
		cameraFovTween = gsap.to(
			camera, {
			fov: cameraDefaultFov,
			ease: selectedObject && !isAbout ? 'power3.inOut' : undefined,
			duration: CAMERA_CHANGE_DURATION,
			onUpdate: () => {
				camera.updateProjectionMatrix();
			}
		})
	}

	camera.lookAt(centerObject.position)

	composer.render();
	requestAnimationFrame(animate);
}


setup();
animate();



window.addEventListener('resize', () => {
	resize()
});

// const ResizeObserver = new window.ResizeObserver(() => {
// 	resize();
// });

// ResizeObserver.observe(document.body);


function setupParticles() {

	// logo size
	const box = new THREE.Box3().setFromObject(logoContainer);
	const size = new THREE.Vector3();
	box.getSize(size);

	// create an invisible shpere around the logo
	const sphere = new THREE.Sphere(new THREE.Vector3(), size.x * 1.5);


	const particleMaterial = new THREE.MeshPhysicalMaterial({
		color: 0xffffff,
		emissive: 0xffffff,
		emissiveIntensity: 0.1,
		metalness: 0,
		roughness: 0.5,
		clearcoat: 1,
		clearcoatRoughness: 0.25,
		reflectivity: 1,
		transparent: true,
		depthTest: true,
		depthWrite: true,
		opacity: 1,
		side: THREE.DoubleSide
	});

	const tetrahedronGeometry = new THREE.TetrahedronGeometry(0.01);
	const icosahedronGeometry = new THREE.IcosahedronGeometry(0.01);


	for (const beltContainer of beltsGroup.children) {
		const belt = beltContainer.children[0] as THREE.Group;

		// create a belt of particles where it's position should be on a horizontal circle around the logo

		for (let j = 0; j < 100; j++) {
			// create a random a tetrahedron or a icosehedron
			const geometry = Math.random() > 0.5 ? tetrahedronGeometry : icosahedronGeometry;
			const particle = new THREE.Mesh(geometry, particleMaterial);
			// set the particle's position on the circumference of the sphere
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.random() * sphere.radius / 2 + sphere.radius;
			particle.position.x = Math.cos(angle) * radius;
			particle.position.z = Math.sin(angle) * radius;
			particle.position.y = Math.random() * 3 - 1.5

			belt.add(particle);
		}
		const a = 8;
		beltContainer.rotation.z = Math.random() * -Math.PI / a * 2 + Math.PI / a;
		beltContainer.rotation.x = Math.random() * -Math.PI / a * 2 + Math.PI / a;

	}

}

function setupStudents() {

	// logo size
	const box = new THREE.Box3().setFromObject(logoContainer);
	const size = new THREE.Vector3();
	box.getSize(size);

	// create an invisible shpere around the logo
	const sphere = new THREE.Sphere(new THREE.Vector3(), size.x * 1.5);


	const particleMaterial = new THREE.MeshPhysicalMaterial({
		color: 0x7853a2,
		emissive: 0x7853a2,
		emissiveIntensity: 1.2,
		metalness: 0,
		roughness: 0.5,
		clearcoat: 1,
		clearcoatRoughness: 0.25,
		reflectivity: 1,
		transparent: true,
		depthTest: true,
		depthWrite: true,
		opacity: 1,
		side: THREE.DoubleSide
	});

	const tetrahedronGeometry = new THREE.TetrahedronGeometry(0.1);
	const octahedronGeometry = new THREE.OctahedronGeometry(0.1);
	const dodecahedronGeometry = new THREE.DodecahedronGeometry(0.1);
	const icosahedronGeometry = new THREE.IcosahedronGeometry(0.1);


	for (const student of studentsLis) {
		// create a random a tetrahedron or a icosehedron
		// const geometry = Math.random() > 0.5 ? tetrahedronGeometry : icosahedronGeometry;


		const rate = Math.min(Math.max(0, +(student.dataset.rate || 0)), 100)

		let geometry = tetrahedronGeometry;

		if (rate >= 50) {
			geometry = octahedronGeometry;
		}

		if (rate >= 70) {
			geometry = dodecahedronGeometry;
		}

		if (rate >= 90) {
			geometry = icosahedronGeometry;
		}

		const _material = particleMaterial.clone();


		// make the additionalEmissiveIntensity exponential

		const exponentialRate = Math.pow(rate / 100, 6)

		_material.emissiveIntensity += exponentialRate * 7;

		const particle = new THREE.Mesh(geometry, _material);
		// set the particle's position on the circumference of the sphere
		const angle = Math.random() * Math.PI * 2;
		const radius = Math.random() * sphere.radius / 1.2 / 2 + sphere.radius / 1.2;
		particle.position.x = Math.cos(angle) * radius;
		particle.position.z = Math.sin(angle) * radius;
		particle.position.y = Math.random() * 1.5 / 2 - 1.5 / 2
		particle.userData = { isStudent: true, element: student };

		gsap.to(particle.rotation, {
			// duration: Math.random() * 2 + 1,
			duration: 0.01 + Math.min(5, 6 / (exponentialRate * 15)),
			y: Math.PI * 2,
			repeat: -1,
			ease: 'none',
		})

		const studentContainer = new THREE.Group();
		studentContainer.add(particle);

		const randomBelt = beltsGroup.children[Math.floor(Math.random() * beltsGroup.children.length)];
		randomBelt.add(studentContainer);

		if (student.id === window.location.hash.slice(1)) {
			selectObject({ object: particle } as any as THREE.Intersection);
		}
	}

}

// create a shape out of an svg file 'logo.svg'
const loader = new SVGLoader();
loader.load('logo.svg', function (data) {
	const paths = data.paths;
	const group = new THREE.Group();



	for (let i = 0; i < paths.length; i++) {

		const path = paths[i];

		path.color = new THREE.Color('#FFFFFF');


		// faintly glowing white material
		const material = new THREE.MeshPhysicalMaterial({
			color: 0xf2eef9,
			emissive: 0x9773c2,
			emissiveIntensity: 0,
			metalness: 0,
			roughness: 0.5,
			clearcoat: 1,
			clearcoatRoughness: 0.25,
			reflectivity: 1,
			transparent: true,
			depthTest: true,
			depthWrite: true,
			opacity: 1,
			side: THREE.DoubleSide
		});

		const shapes = SVGLoader.createShapes(path);

		for (let j = 0; j < shapes.length; j++) {

			const shape = shapes[j];
			const extrudeSettings = {
				curveSegments: 12,
				steps: 2,
				depth: 512 / 4,
				bevelEnabled: true,
				bevelThickness: 1,
				bevelSize: 1,
				bevelOffset: 0,
				bevelSegments: 1
			};
			const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
			const mesh = new THREE.Mesh(geometry, material);
			group.add(mesh);

		}

	}

	// get the size of the group
	const box = new THREE.Box3().setFromObject(group);
	const size = new THREE.Vector3();
	box.getSize(size);
	const scale = 0.005;

	// center the group
	group.position.x = -size.x * 0.5 * scale;
	group.position.y = -size.y * 0.5 * scale;
	group.position.z = -size.z * 0.5 * scale;

	// scale the group
	group.scale.set(scale, scale, scale);

	// const container = new THREE.Object3D();
	logoContainer.add(group);

	setupParticles();

	setupStudents();

});

function resize() {
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;
	canvas.width = 0;
	canvas.height = 0;

	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	const pixelRatio = renderer.getPixelRatio();
	fxaaPass.material.uniforms['resolution'].value.x = 1 / (sizes.width * pixelRatio);
	fxaaPass.material.uniforms['resolution'].value.y = 1 / (sizes.height * pixelRatio);
	composer.setSize(sizes.width, sizes.height);

	bloomPass.resolution.set(sizes.width, sizes.height);

	console.log(sizes.width, sizes.height);
}



var isPointerDown = false;
var previousCameraHAngle = cameraAngles.horizontal;
var previousCameraVAngle = cameraAngles.vertical;
var cancelPointerUp = false;
let isPointerMoved = false;
let pointerDownX = 0;
let pointerDownY = 0;

var selectedObject: THREE.Mesh | null = null;
let selectedObjectMaterial: THREE.MeshPhysicalMaterial | null = null;


function selectObject(firstIntersect: THREE.Intersection | null, updateHash = true) {

	if (!selectedObject && !firstIntersect?.object) {
		return;
	}

	if (
		firstIntersect?.object?.uuid !== selectedObject?.uuid
		|| !firstIntersect?.object
	) {
		if (selectedObject?.material instanceof THREE.Material && selectedObjectMaterial) {
			selectedObject.material = selectedObjectMaterial;
		}

		if (
			firstIntersect?.object instanceof THREE.Mesh &&
			firstIntersect.object.userData?.isStudent
		) {
			selectedObject = firstIntersect.object as THREE.Mesh;
			selectedObjectMaterial = hoveredObjectMaterial || selectedObject.material as THREE.MeshPhysicalMaterial;

			// selectedObject.material = new THREE.MeshPhysicalMaterial({
			// 	color: 0xd1c1e6,
			// 	emissive: 0x54396f,
			// 	emissiveIntensity: 15,
			// 	metalness: 0,
			// 	roughness: 0.5,
			// 	clearcoat: 1,
			// 	clearcoatRoughness: 0.25,
			// 	reflectivity: 1,
			// 	transparent: true,
			// 	depthTest: true,
			// 	depthWrite: true,
			// 	opacity: 1,
			// 	side: THREE.DoubleSide
			// });






			if (selectedObject) {
				gsap.to(
					distantLight, {
					intensity: distantLightIntensities.close,
					duration: CAMERA_CHANGE_DURATION
				})
				gsap.to(
					distantBehindLight, {
					intensity: distantBehindLightIntensities.close,
					duration: CAMERA_CHANGE_DURATION
				})

				gsap.to(
					distantBehindLight2, {
					intensity: distantBehindLight2Intensities.close,
					duration: CAMERA_CHANGE_DURATION
				})

				selectedObject.getWorldPosition(target)
				const distance = target.distanceTo(centerObject.position) + 3;
				target.normalize();
				const horizontalAngle = Math.atan2(target.z, target.x);
				const verticalAngle = Math.asin(target.y) - 0.035;

				setCameraAngles(
					horizontalAngle,
					verticalAngle,
					distance,
					false,
					true,
				)

			}

		} else {
			selectedObject = null;
			selectedObjectMaterial = null;

			gsap.to(
				distantLight, {
				intensity: distantLightIntensities.far,
				duration: CAMERA_CHANGE_DURATION
			})

			gsap.to(
				distantBehindLight, {
				intensity: distantBehindLightIntensities.far,
				duration: CAMERA_CHANGE_DURATION
			}
			)

			gsap.to(
				distantBehindLight2, {
				intensity: distantBehindLight2Intensities.far,
				duration: CAMERA_CHANGE_DURATION
			}
			)

		}
	}


	if (updateHash) {
		const newHash = selectedObject?.userData.element?.id;
		if (window.location.hash.slice(1) !== newHash) {
			debounce(() => {
				window.location.hash = newHash || '';
				// window.history.pushState(null, '', `#${newHash}`);
			}, 100, 'hashupdate');
		}

		// selectedObject = null;
	}
}


function onPointerUp(event: PointerEvent) {
	if (cancelPointerUp || !isPointerDown || isAbout || pointerId !== event.pointerId) {
		cancelPointerUp = false;
		return;
	};

	isPointerDown = false;

	if (isPointerMoved) {
		isPointerMoved = false;
		return;
	}

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;


	raycaster.setFromCamera(pointer, camera);

	const intersects = raycaster.intersectObjects(scene.children);

	const firstIntersect = intersects[0];

	console.log(firstIntersect.object?.name);

	if (firstIntersect?.object) {
		selectObject(firstIntersect);
	}

	tooltipElement.style.display = 'none';

}

let hoveredObject: THREE.Mesh | null = null;
let hoveredObjectMaterial: THREE.MeshPhysicalMaterial | null = null;
const tooltipElement = document.getElementById('tooltip') as HTMLElement;
function onPointerMove(event: PointerEvent) {


	if (cancelPointerUp || isAbout || pointerId !== event.pointerId) {
		return;
	}
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components


	// ignore if clicked down
	if (isPointerDown) {
		const dx = event.clientX - pointerDownX;
		const dy = event.clientY - pointerDownY;

		if (Math.abs(dx) + Math.abs(dy) > 10) {

			if (selectedObject) {
				selectObject(null)
			}

			const newH = previousCameraHAngle + dx / 1024 * Math.PI;
			const newV = previousCameraVAngle + dy / 1024 * Math.PI;

			const dH = newH - cameraAngles.horizontal;
			const dV = newV - cameraAngles.vertical;

			cameraAnglesMomentum.horizontal = dH * 0.5;
			cameraAnglesMomentum.vertical = dV * 0.3;
			isPointerMoved = true;

			setCameraMomentum(
				0,
				0,
				5
			)


			setCameraAngles(
				newH,
				newV,
				undefined,
				false,
			);
		}

		return;
	}

	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(pointer, camera);

	const intersects = raycaster.intersectObjects(scene.children);

	const firstIntersect = intersects[0];

	if (
		!isAbout &&
		(firstIntersect?.object?.uuid !== hoveredObject?.uuid &&
			firstIntersect?.object?.uuid !== selectedObject?.uuid
			|| !firstIntersect?.object)
	) {
		if (hoveredObject && hoveredObjectMaterial && !(hoveredObject.uuid === selectedObject?.uuid)) {
			hoveredObject.material = hoveredObjectMaterial;
		}


		if (
			firstIntersect?.object instanceof THREE.Mesh &&
			firstIntersect.object.userData?.isStudent
		) {
			document.body.style.cursor = 'pointer';
			hoveredObject = firstIntersect.object as THREE.Mesh;
			hoveredObjectMaterial = hoveredObject.material as THREE.MeshPhysicalMaterial;

			tooltipElement.innerHTML = hoveredObject.userData.element.innerHTML;
		} else {
			hoveredObject = null;
			hoveredObjectMaterial = null;
			document.body.style.removeProperty('cursor');
		}
	}

	if (hoveredObject) {
		tooltipElement.style.display = 'block';

		const rect = tooltipElement.getBoundingClientRect();

		const boxHeight = rect.height;
		const boxWidth = rect.width;

		const x = event.clientX;
		const y = event.clientY;

		let left = x - boxWidth / 2;
		let top = y - boxHeight - 20;

		if (top < 0) {
			top = y + 20 * 2;
		}

		if (left < 0) {
			left = 0;
		}

		if (left > window.innerWidth - boxWidth) {
			left = window.innerWidth - boxWidth;
		}


		tooltipElement.style.left = `${left}px`;
		tooltipElement.style.top = `${top}px`;


	} else {
		tooltipElement.style.display = 'none';
	}
}

let pointerId = -1
function onPointerDown(event: PointerEvent) {


	if (isAbout) return;

	if (event.target instanceof HTMLElement) {
		if (!['canvas', 'main'].includes(event.target.tagName.toLowerCase()) || event.button !== 0) {
			isPointerMoved = false;
			cancelPointerUp = true;
			return;
		}
	}

	isPointerDown = true;
	pointerId = event.pointerId;

	cameraDefaultTarget.copy(camera.position);
	cameraAnglesTween?.kill();
	cameraAnglesMomentum.horizontal = 0;
	cameraAnglesMomentum.vertical = 0
	setCameraMomentum(
		0,
		0,
	)

	setCameraAngles(
		currentCameraAngles.horizontal,
		currentCameraAngles.vertical,
		currentCameraAngles.radius,
		false,
	)

	isPointerDown = true;
	pointerDownX = event.clientX;
	pointerDownY = event.clientY;
	previousCameraHAngle = cameraAngles.horizontal;
	previousCameraVAngle = cameraAngles.vertical;

	if (selectedObject) {
		selectedObject.getWorldPosition(target)
		target.normalize();
		const horizontalAngle = Math.atan2(target.z, target.x);
		const verticalAngle = Math.min(Math.PI / 6, Math.max(-Math.PI / 6, Math.asin(target.y)));
		previousCameraHAngle = horizontalAngle;
		previousCameraVAngle = verticalAngle;

	}
}

document.addEventListener('pointerdown', onPointerDown, {
	capture: true
});

document.addEventListener('pointerup', onPointerUp, {
	capture: true,
});
document.addEventListener('pointerleave', onPointerUp, {
	capture: true,
});
document.addEventListener('pointermove', onPointerMove, {
	capture: true,
	passive: true,
});


let previousHash = window.location.hash.slice(1);
// listen to on hash change
window.addEventListener('hashchange', () => {

	const actions = document.querySelector('#actions') as HTMLElement;

	if (actions) {
		actions.classList.remove('expand-animation');
		void actions.offsetWidth;
		actions.classList.add('expand-animation');
	}

	const id = window.location.hash.slice(1);
	const currentSelectedId = selectedObject?.userData.element.id;

	if (previousHash === id) {
		return;
	}

	previousHash = id;

	if (id === 'about') {
		selectObject(null, false);
		isAbout = true;
		setCameraMomentum(
			aboutCameraHorizontalMomentum,
			0
		)

		afterImagePassTween?.kill();
		afterImagePassTween = gsap.to(afterimagePass.uniforms['damp'], {
			value: AFTER_IMAGE_DAMP_ABOUT,
			duration: CAMERA_CHANGE_DURATION * 0.5,
		})
		return;
	} else {
		setCameraMomentum(0, 0, 20)
		isAbout = false;
		afterImagePassTween?.kill();
		afterImagePassTween = gsap.to(afterimagePass.uniforms['damp'], {
			value: AFTER_IMAGE_DAMP_DEFAULT,
			duration: CAMERA_CHANGE_DURATION * 2,
		})
	}


	if (id !== currentSelectedId) {
		const students = beltsGroup.children.flatMap(beltContainer => {
			return beltContainer.children.flatMap(belt => belt.children);
		}).filter((child) => {
			return child.userData.isStudent;
		});

		const student = students.find(student => student.userData.element.id === id);
		if (student) {
			selectObject({ object: student } as any as THREE.Intersection);
		} else {
			selectObject(null);
		}
	}
})


const nextStudnetButton = document.getElementById('next-student') as HTMLButtonElement;
const prevStudentButton = document.getElementById('prev-student') as HTMLButtonElement;

nextStudnetButton.addEventListener('click', () => {
	const students = beltsGroup.children.flatMap(beltContainer => {
		return beltContainer.children.flatMap(belt => belt.children);
	}).filter((child) => {
		return child.userData.isStudent;
	});

	const currentIndex = students.findIndex(student => student.uuid === selectedObject?.uuid);
	const nextIndex = (currentIndex + 1) % students.length;
	selectObject({ object: students[nextIndex] } as any as THREE.Intersection);
})

prevStudentButton.addEventListener('click', () => {
	const students = beltsGroup.children.flatMap(beltContainer => {
		return beltContainer.children.flatMap(belt => belt.children);
	}).filter((child) => {
		return child.userData.isStudent;
	});

	const currentIndex = students.findIndex(student => student.uuid === selectedObject?.uuid);
	const prevIndex = (currentIndex - 1 + students.length) % students.length;
	selectObject({ object: students[prevIndex] } as any as THREE.Intersection);
});


window.onscroll = () => {
	console.log("scrolling")
	window.scrollTo(0, 0);
}

const fullscreenButton = document.getElementById('fullscreen') as HTMLButtonElement;

fullscreenButton.addEventListener('click', () => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	} else {
		document.documentElement.requestFullscreen();
	}
})

// detect if full screen, then add class to body
document.addEventListener('fullscreenchange', () => {
	if (document.fullscreenElement) {
		document.body.classList.add('fullscreen');
	} else {
		document.body.classList.remove('fullscreen');
	}
})

// detect lang attribute change and update the document direction
const mutationObserver = new MutationObserver(() => {
	document.documentElement.dir = document.documentElement.lang === 'ar' ? 'rtl' : 'ltr';
});

mutationObserver.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ['lang'],
})

studentsLis.forEach((student) => {
	// add mousewheel event to the students list
	const accreditation = student.querySelector('.accreditation') as HTMLElement;
	student.addEventListener('wheel', (event) => {
		accreditation?.scrollBy({
			top: event.deltaY,
			behavior: 'smooth'
		})
	})
});


