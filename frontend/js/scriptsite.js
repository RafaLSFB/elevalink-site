// ==== Seção de equipe ====
const team = [
  { nome: "César Augusto", linkedin: "https://www.linkedin.com/in/c%C3%A9sar-augusto-83b97237b", telefone: "ceaugustofilho6@gmail.com", foto: "imagens/Cesar.jpg" },
  { nome: "Fernando Castanha", linkedin: "https://www.linkedin.com/in/fernando-castanha-tornelli-235412352/", telefone: "Fctornelli@gmail.com", foto: "imagens/Fernando.jpg" },
  { nome: "Gabriel Assis", linkedin: "https://www.linkedin.com/in/gabriel-assis-7044b938a/", telefone: "Gabriel.dge.assis@gmail.com", foto: "imagens/Gabriel.jpg" },
  { nome: "Luiz Barros", linkedin: "https://www.linkedin.com/in/luizhenriquebarros/", telefone: "luizh.barros1109@gmail.com", foto: "imagens/Luiz.jpg" },
  { nome: "Nicholas Maretto", linkedin: "https://www.linkedin.com/in/nicmaretto", telefone: "nicmarett13@gmail.com", foto: "imagens/Nicholas.jpg" },
  { nome: "Rafael Lucca", linkedin: "https://www.linkedin.com/in/rafaelluccabazan", telefone: "rafaelluccabazan@gmail.com", foto: "imagens/Rafael.jpg" },
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

// ==== Visualizador STL (REMOVIDO) ====
// O código THREE.js que estava aqui foi removido
// pois seu HTML está usando <model-viewer>
// para carregar os modelos .glb.