// ==== Seção de equipe ====
const team = [
  { nome: "César Augusto", linkedin: "https://www.linkedin.com/in/c%C3%A9sar-augusto-83b97237b", telefone: "(68) 99205-8721", foto: "imagens/Cesar.jpg" },
  { nome: "Fernando Castanha", linkedin: "https://www.linkedin.com/in/fernando-castanha-tornelli-235412352/", telefone: "(11) 99136-7940", foto: "imagens/Fernando.jpg" },
  { nome: "Gabriel Assis", linkedin: "https://www.linkedin.com/in/gabriel-assis-7044b938a/", telefone: "(11) 94523-5478", foto: "imagens/Gabriel.jpg" },
  { nome: "Luiz Barros", linkedin: "https://www.linkedin.com/in/luizhenriquebarros/", telefone: "(11) 99410-9391", foto: "imagens/Fernando.jpg" },
  { nome: "Nicholas Maretto", linkedin: "https://www.linkedin.com/in/nicmaretto", telefone: "(11) 97517-1310", foto: "imagens/Fernando.jpg" },
  { nome: "Rafael Lucca Bazan", linkedin: "https://www.linkedin.com/in/rafaelluccabazan", telefone: "(11) 98811-5600", foto: "imagens/Fernando.jpg" },
]

const teamContainer = document.querySelector('.team');

team.forEach(member => {
  const card = document.createElement('div');
  card.classList.add('member-card');
  card.innerHTML = `
    <img src="${member.foto}" alt="${member.nome}">
    <h3>${member.nome}</h3>
    <p>${member.telefone}</p>
    <p><a href="${member.linkedin}" target="_blank">LinkedIn</a></p>
  `;
  teamContainer.appendChild(card);
});

// ==== Fade-in dos cards ====
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.member-card').forEach(card => observer.observe(card));

// ==== Fade-in do título ====
const heroTitle = document.querySelector('.hero-title');
window.addEventListener('load', () => {
  setTimeout(() => heroTitle.classList.add('show'), 1000);
});

// ==== Visualizador STL ====
const container = document.getElementById("viewer3d");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, container.clientWidth / 400, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(container.clientWidth, 400);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const light1 = new THREE.DirectionalLight(0x00aaff, 1);
light1.position.set(1, 1, 1);
scene.add(light1);

const light2 = new THREE.AmbientLight(0x404040, 1.5);
scene.add(light2);

const loader = new THREE.STLLoader();
loader.load("dispositivo.stl", geometry => {
  const material = new THREE.MeshPhongMaterial({ color: 0x00aaff, shininess: 80 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.2;
  scene.add(mesh);

  // Centraliza o modelo
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  mesh.position.sub(center);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  camera.position.set(2, 2, 2);
  controls.update();

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
});