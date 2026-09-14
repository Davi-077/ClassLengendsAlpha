
const app = document.getElementById("app");
const cfg = window.CLASS_LEGENDS_CONFIG || {};
const hasSupabase = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
const db = hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

const state = {
  screen: "start",
  authTab: "login",
  tutorialIndex: 0,
  session: loadSession(),
  selectedCharacter: null,
};

const tutorials = [
  {icon:"🧭", title:"Como funciona Class Legends", text:"Você explora mapas vistos de cima, enfrenta bots e jogadores e monta o seu personagem com poderes, habilidades e equipamentos."},
  {icon:"⚔️", title:"Classes", text:"Existem Guerreiros, Ninjas, Piratas, Fadas e Médicos. Cada classe tem pontos fortes e fracos e dois personagens-base."},
  {icon:"🎯", title:"Seu conjunto de combate", text:"Você escolhe 4 ataques ou poderes. Além deles, existe 1 habilidade própria da classe e 1 Super ligada ao Núcleo de Poder."},
  {icon:"💎", title:"Núcleos de Poder", text:"Os Núcleos dão famílias de poderes e uma Super. Exemplos: Vento, Gelo, Luz, Sombra, Tempestade, Rocha, Maré, Chama, Veneno e Lâmina."},
  {icon:"🌟", title:"Super", text:"A Super carrega quando você contribui na batalha: causando dano, curando, protegendo ou bloqueando dano."},
];

const characters = [
  {id:"guerreiro_1", name:"Guerreiro 1", cls:"Guerreiro", css:"guerreiro", desc:"Força e armas pesadas", provisional:true},
  {id:"guerreiro_2", name:"Guerreiro 2", cls:"Guerreiro", css:"guerreiro", desc:"Proteção, armadura e escudos", provisional:true},
  {id:"ninja_1", name:"Ninja 1", cls:"Ninja", css:"ninja", desc:"Velocidade e armas de arremesso", provisional:true},
  {id:"ninja_2", name:"Ninja 2", cls:"Ninja", css:"ninja", desc:"Furtividade e lâminas leves", provisional:true},
  {id:"pirata_1", name:"Pirata 1", cls:"Pirata", css:"pirata", desc:"Especialista em lâminas", provisional:true},
  {id:"pirata_2", name:"Pirata 2", cls:"Pirata", css:"pirata", desc:"Pistolas, mosquetes e canhões", provisional:true},
  {id:"fada_1", name:"Fada 1", cls:"Fada", css:"fada", desc:"Cura, luz e proteção", provisional:true},
  {id:"fada_2", name:"Fada 2", cls:"Fada", css:"fada", desc:"Magia ofensiva", provisional:true},
  {id:"medico_1", name:"Médico 1", cls:"Médico", css:"medico", desc:"Cura", provisional:true},
  {id:"medico_2", name:"Médico 2", cls:"Médico", css:"medico", desc:"Antídotos, venenos e melhorias", provisional:true},
];

function starterKitFor(c){
  if(c.cls === "Médico"){
    return [
      "Poder básico de apoio — provisório",
      "Poder básico de defesa — provisório",
      "Poção especial da classe",
      "1 Núcleo inicial de teste — provisório",
    ];
  }
  const weapon = {
    Guerreiro:"Espada do Recruta",
    Ninja:"Kunais de Treino",
    Pirata:"Pistola do Marinheiro",
    Fada:"Varinha de Madeira",
  }[c.cls];
  return [
    `${weapon} — arma comum`,
    "1 poder básico da classe — provisório",
    "1 Núcleo inicial de teste — provisório",
    "1 item visual inicial — provisório",
  ];
}

function saveSession(s){
  localStorage.setItem("cl_session", JSON.stringify(s));
}
function loadSession(){
  try{return JSON.parse(localStorage.getItem("cl_session")) || null}catch{return null}
}
function clearSession(){
  localStorage.removeItem("cl_session");
}

function escapeHtml(v=""){
  return v.replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function layout(inner){
  return `
    ${!hasSupabase ? `<div class="topbar"><span class="demo">Modo local: sem sincronização entre dispositivos</span></div>` : ""}
    <div class="shell">${inner}</div>
  `;
}

function logo(){
  return `<div class="logo">
    <div class="logo-mark">⚔️</div>
    <div class="top">CLASS</div>
    <div class="bottom">LEGENDS</div>
  </div>`;
}

function render(){
  if(state.screen==="start") return renderStart();
  if(state.screen==="auth") return renderAuth();
  if(state.screen==="tutorial") return renderTutorial();
  if(state.screen==="choose") return renderChoose();
  if(state.screen==="kit") return renderKit();
}

function renderStart(){
  app.innerHTML = layout(`
    <section class="card hero">
      ${logo()}
      <p class="sub">Entre na arena, escolha sua classe e construa sua lenda.</p>
      <button class="primary" id="playBtn">JOGAR</button>
    </section>`);
  document.getElementById("playBtn").onclick=()=>{state.screen="auth";render()};
}

function renderAuth(message="", type=""){
  const create = state.authTab==="create";
  app.innerHTML = layout(`
    <section class="card">
      ${logo()}
      <div class="tabs">
        <button class="tab ${!create?"active":""}" data-tab="login">Já tenho uma conta</button>
        <button class="tab ${create?"active":""}" data-tab="create">Criar conta</button>
      </div>
      <h2 class="title">${create?"Criar sua conta":"Entrar"}</h2>
      <p class="sub">${create?"Sua conta guarda seu progresso.":"Use o mesmo nome e senha em outro aparelho para entrar na mesma conta."}</p>
      ${message?`<div class="message ${type}">${message}</div>`:""}
      <form id="authForm">
        <div class="field">
          <label>Nome de usuário</label>
          <input id="username" autocomplete="username" maxlength="24" required placeholder="Ex.: DaviSan" />
        </div>
        <div class="field">
          <label>Senha</label>
          <input id="password" type="password" autocomplete="${create?"new-password":"current-password"}" minlength="4" required placeholder="Sua senha" />
        </div>
        ${create?`
        <div class="field">
          <label>E-mail <span class="small">(opcional)</span></label>
          <input id="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" />
          <p class="note">Se você colocar um e-mail, ele poderá ser usado no futuro para ajudar a recuperar sua conta caso esqueça a senha.</p>
        </div>`:""}
        <button class="primary" type="submit">${create?"CRIAR CONTA":"ENTRAR"}</button>
      </form>
    </section>`);
  document.querySelectorAll("[data-tab]").forEach(btn=>{
    btn.onclick=()=>{state.authTab=btn.dataset.tab;renderAuth()}
  });
  document.getElementById("authForm").onsubmit=handleAuth;
}

async function handleAuth(e){
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const email = document.getElementById("email")?.value.trim() || "";
  if(username.length < 3) return renderAuth("O nome precisa ter pelo menos 3 caracteres.","error");

  if(!hasSupabase){
    return state.authTab==="create"
      ? localRegister(username,password,email)
      : localLogin(username,password);
  }

  try{
    if(state.authTab==="create"){
      const {data,error}=await db.rpc("register_player",{p_username:username,p_password:password,p_email:email||null});
      if(error) throw error;
      if(!data?.ok) return renderAuth(data?.message || "Não foi possível criar a conta.","error");
      state.session = data.player;
      saveSession(state.session);
      state.screen="tutorial";
      render();
    }else{
      const {data,error}=await db.rpc("login_player",{p_username:username,p_password:password});
      if(error) throw error;
      if(!data?.ok) return renderAuth(data?.message || "Usuário ou senha incorretos.","error");
      state.session = data.player;
      saveSession(state.session);
      if(state.session.first_character_id){
        state.selectedCharacter = characters.find(c=>c.id===state.session.first_character_id);
        state.screen="kit";
      } else {
        state.screen="tutorial";
      }
      render();
    }
  }catch(err){
    renderAuth("Erro de conexão com o banco. Confira a configuração do Supabase.","error");
    console.error(err);
  }
}

function localRegister(username,password,email){
  const users=JSON.parse(localStorage.getItem("cl_demo_users")||"[]");
  if(users.some(u=>u.username.toLowerCase()===username.toLowerCase())){
    return renderAuth("Esse nome de usuário já existe neste aparelho.","error");
  }
  const player={
    id:crypto.randomUUID(),
    username,
    email:email||null,
    password, // SOMENTE no modo local de demonstração.
    public_code:"CL-"+Math.random().toString(36).slice(2,8).toUpperCase(),
    first_character_id:null
  };
  users.push(player);
  localStorage.setItem("cl_demo_users",JSON.stringify(users));
  state.session={...player}; delete state.session.password;
  saveSession(state.session);
  state.screen="tutorial";
  render();
}

function localLogin(username,password){
  const users=JSON.parse(localStorage.getItem("cl_demo_users")||"[]");
  const player=users.find(u=>u.username.toLowerCase()===username.toLowerCase() && u.password===password);
  if(!player) return renderAuth("Usuário ou senha incorretos.","error");
  state.session={...player}; delete state.session.password;
  saveSession(state.session);
  if(player.first_character_id){
    state.selectedCharacter=characters.find(c=>c.id===player.first_character_id);
    state.screen="kit";
  }else{
    state.screen="tutorial";
  }
  render();
}

function renderTutorial(){
  const t=tutorials[state.tutorialIndex];
  const pct=((state.tutorialIndex+1)/tutorials.length)*100;
  app.innerHTML=layout(`
    <section class="card">
      <span class="badge">Tutorial ${state.tutorialIndex+1}/${tutorials.length}</span>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="tutorial-card">
        <div class="tutorial-icon">${t.icon}</div>
        <h2>${t.title}</h2>
        <p class="sub">${t.text}</p>
      </div>
      <button class="primary" id="nextTut">${state.tutorialIndex===tutorials.length-1?"ESCOLHER MEU PRIMEIRO PERSONAGEM":"CONTINUAR"}</button>
    </section>`);
  document.getElementById("nextTut").onclick=()=>{
    if(state.tutorialIndex<tutorials.length-1){state.tutorialIndex++;render()}
    else{state.screen="choose";render()}
  };
}

function renderChoose(){
  app.innerHTML=layout(`
    <section class="card">
      <span class="badge">Primeira escolha</span>
      <h1>Escolha seu primeiro personagem</h1>
      <p class="sub">Os nomes e histórias ainda serão definidos. As especialidades abaixo são <strong>provisórias</strong>.</p>
      <div class="character-grid">
        ${characters.map(c=>`
          <button class="character ${c.css} ${state.selectedCharacter?.id===c.id?"selected":""}" data-char="${c.id}">
            <div class="badge">${c.cls}</div>
            <h3>${c.name}</h3>
            <p class="sub">${c.desc}</p>
          </button>`).join("")}
      </div>
      <div style="height:14px"></div>
      <button class="primary" id="confirmChar" ${state.selectedCharacter?"":"disabled"}>CONFIRMAR PERSONAGEM</button>
    </section>`);
  document.querySelectorAll("[data-char]").forEach(btn=>{
    btn.onclick=()=>{state.selectedCharacter=characters.find(c=>c.id===btn.dataset.char);renderChoose()}
  });
  const confirm=document.getElementById("confirmChar");
  confirm.style.opacity=state.selectedCharacter?"1":".45";
  confirm.onclick=saveCharacter;
}

async function saveCharacter(){
  if(!state.selectedCharacter) return;
  if(hasSupabase){
    try{
      const {data,error}=await db.rpc("choose_first_character",{
        p_player_id:state.session.id,
        p_character_id:state.selectedCharacter.id
      });
      if(error) throw error;
      if(!data?.ok) return alert(data?.message || "Não foi possível salvar o personagem.");
      state.session.first_character_id=state.selectedCharacter.id;
      saveSession(state.session);
    }catch(e){
      console.error(e);
      return alert("Erro ao salvar no banco.");
    }
  }else{
    const users=JSON.parse(localStorage.getItem("cl_demo_users")||"[]");
    const i=users.findIndex(u=>u.id===state.session.id);
    if(i>=0){users[i].first_character_id=state.selectedCharacter.id;localStorage.setItem("cl_demo_users",JSON.stringify(users))}
    state.session.first_character_id=state.selectedCharacter.id;
    saveSession(state.session);
  }
  state.screen="kit";
  render();
}

function renderKit(){
  const c=state.selectedCharacter || characters.find(x=>x.id===state.session?.first_character_id);
  const kit=starterKitFor(c);
  app.innerHTML=layout(`
    <section class="card">
      <span class="badge">Conta criada e personagem salvo</span>
      <h1>${c.name}</h1>
      <p class="sub">Seu primeiro personagem foi escolhido. Agora você receberia o kit inicial para começar a montagem.</p>
      <div class="message ok">✓ ${hasSupabase?"Dados salvos no banco de dados.":"Fluxo funcionando em modo local. Para sincronizar em outros aparelhos, conecte o Supabase."}</div>
      <h2>Kit inicial de teste</h2>
      <p class="note">Os itens marcados como provisórios servem apenas para testar a programação e ainda não viraram regra oficial.</p>
      <div class="kit">${kit.map(x=>`<div class="kit-item">🎒 ${x}</div>`).join("")}</div>
      <button class="secondary" id="logoutBtn">SAIR DA CONTA</button>
    </section>`);
  document.getElementById("logoutBtn").onclick=()=>{clearSession();state.session=null;state.selectedCharacter=null;state.screen="auth";render()};
}

// Se já existe sessão local, abre no ponto certo.
if(state.session){
  if(state.session.first_character_id){
    state.selectedCharacter=characters.find(c=>c.id===state.session.first_character_id);
    state.screen="kit";
  } else {
    state.screen="tutorial";
  }
}
render();
